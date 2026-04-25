import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import "dotenv/config";
import { triagePatient } from "./agents/triage.js";
import { runSpecialistConsultation } from "./agents/specialist.js";
import { generateSummaryReport } from "./agents/summary.js";
import { getBalance } from "./payments/circle.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AGENT_WALLETS = {
  triage: { id: process.env.TRIAGE_WALLET_ID, address: process.env.TRIAGE_WALLET_ADDRESS },
  cardiology: { id: process.env.CARDIOLOGY_WALLET_ID, address: process.env.CARDIOLOGY_WALLET_ADDRESS },
  neurology: { id: process.env.NEUROLOGY_WALLET_ID, address: process.env.NEUROLOGY_WALLET_ADDRESS },
  pulmonology: { id: process.env.PULMONOLOGY_WALLET_ID, address: process.env.PULMONOLOGY_WALLET_ADDRESS },
  gastroenterology: { id: process.env.GASTRO_WALLET_ID, address: process.env.GASTRO_WALLET_ADDRESS },
  general: { id: process.env.GENERAL_WALLET_ID, address: process.env.GENERAL_WALLET_ADDRESS },
  summary: { id: process.env.SUMMARY_WALLET_ID, address: process.env.SUMMARY_WALLET_ADDRESS },
};

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// SSE endpoint for real-time streaming
app.post('/api/run', async (req, res) => {
  // Set up Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emit = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const symptoms = req.body.symptoms;
    const allTransactions = [];

    // STEP 1: Triage starts
    emit('agent_update', { agent: 'triage', status: 'active', message: 'Analysing symptoms…' });
    emit('stats_update', { agents: '1 / 7' });
    emit('log', { message: 'Triage Agent: analysing…', type: 'a' });

    const triage = await triagePatient(symptoms, AGENT_WALLETS.triage.id);

    // STEP 2: Triage complete
    const specialistsList = triage.specialistsNeeded.join(', ');
    emit('agent_update', { agent: 'triage', status: 'done', message: `Routed → ${specialistsList}` });
    emit('log', { message: `Triage: ${triage.severity.toUpperCase()} severity → ${specialistsList}`, type: 's' });
    emit('stats_update', { agents: `${triage.specialistsNeeded.length} / 7` });

    // STEP 3: Triage payments (routing fees)
    for (const payment of triage.payments) {
      const specialist = triage.specialistsNeeded.find(s => 
        payment.to.toLowerCase().includes(s.slice(0, 4))
      ) || 'specialist';
      
      const specialistCap = specialist.charAt(0).toUpperCase() + specialist.slice(1);
      const edgeId = `e-t${specialist.charAt(0)}`; // e.g., "e-tc" for cardiology
      
      emit('payment', {
        edge: edgeId,
        amount: payment.amount,
        from: 'Triage',
        to: specialistCap,
        txId: payment.transactionId,
        explorer: payment.explorerUrl,
        state: payment.state
      });
      emit('log', { message: `💸 ${payment.amount} USDC → ${specialistCap} (routing fee)`, type: 'p' });

      allTransactions.push({
        from: "Triage Agent",
        to: payment.to,
        amount: payment.amount,
        state: payment.state,
        explorer: payment.explorerUrl
      });
    }

    // STEP 4: Specialist consultations
    const consultations = [];
    for (const specialist of triage.specialistsNeeded) {
      const specialistCap = specialist.charAt(0).toUpperCase() + specialist.slice(1);
      
      // Specialist starts
      emit('agent_update', { agent: specialist, status: 'active', message: 'Consulting…' });
      const activeCount = triage.specialistsNeeded.indexOf(specialist) + 2; // +2 for triage already done + current
      emit('stats_update', { agents: `${activeCount} / 7` });
      emit('log', { message: `${specialistCap} Agent: consulting…`, type: 'a' });

      const wallet = AGENT_WALLETS[specialist] ?? AGENT_WALLETS.general;
      const result = await runSpecialistConsultation(specialist, symptoms, wallet.id, AGENT_WALLETS.summary.address);
      consultations.push(result);

      // Specialist complete
      emit('agent_update', { agent: specialist, status: 'done', message: `${result.urgency} urgency` });
      emit('log', { message: `${specialistCap}: ${result.urgency} urgency`, type: 's' });

      // Specialist pays summary agent
      if (result.paymentToSummary) {
        const edgeId = `e-${specialist.charAt(0)}s`; // e.g., "e-cs" for cardiology->summary
        
        emit('payment', {
          edge: edgeId,
          amount: result.paymentToSummary.amount,
          from: specialistCap,
          to: 'Summary',
          txId: result.paymentToSummary.transactionId,
          explorer: result.paymentToSummary.explorerUrl,
          state: result.paymentToSummary.state
        });
        emit('log', { message: `💸 ${result.paymentToSummary.amount} USDC → Summary (consultation fee)`, type: 'p' });

        allTransactions.push({
          from: `${specialist} Agent`,
          to: "Summary Agent",
          amount: result.paymentToSummary.amount,
          state: result.paymentToSummary.state,
          explorer: result.paymentToSummary.explorerUrl
        });
      }
    }

    // STEP 5: Summary agent
    emit('agent_update', { agent: 'summary', status: 'active', message: 'Compiling report…' });
    emit('stats_update', { agents: '1 / 7' });
    emit('log', { message: 'Summary Agent: compiling final report…', type: 'a' });

    const report = await generateSummaryReport(symptoms, consultations);

    emit('agent_update', { agent: 'summary', status: 'done', message: 'Report compiled' });
    emit('stats_update', { agents: '0 / 7', status: 'Done ✓' });

    // STEP 6: Final report and stats
    const totalUSDC = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(6);
    
    emit('log', { message: `✅ Complete — ${allTransactions.length} txns · $${totalUSDC} USDC settled`, type: 's' });
    
    emit('complete', {
      report,
      transactions: {
        total: allTransactions.length,
        totalUSDC,
        details: allTransactions
      }
    });

  } catch (error) {
    emit('error', { message: error.message });
  } finally {
    res.end();
  }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000/dashboard.html'));