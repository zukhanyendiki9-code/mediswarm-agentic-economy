import "dotenv/config";
import { triagePatient } from "./agents/triage.js";
import { runSpecialistConsultation } from "./agents/specialist.js";
import { generateSummaryReport } from "./agents/summary.js";
import { getBalance } from "./payments/circle.js";

const AGENT_WALLETS = {
  triage: {
    id: process.env.TRIAGE_WALLET_ID!,
    address: process.env.TRIAGE_WALLET_ADDRESS!,
  },
  cardiology: {
    id: process.env.CARDIOLOGY_WALLET_ID!,
    address: process.env.CARDIOLOGY_WALLET_ADDRESS!,
  },
  neurology: {
    id: process.env.NEUROLOGY_WALLET_ID!,
    address: process.env.NEUROLOGY_WALLET_ADDRESS!,
  },
  pulmonology: {
    id: process.env.PULMONOLOGY_WALLET_ID!,
    address: process.env.PULMONOLOGY_WALLET_ADDRESS!,
  },
  gastroenterology: {
    id: process.env.GASTRO_WALLET_ID!,
    address: process.env.GASTRO_WALLET_ADDRESS!,
  },
  general: {
    id: process.env.GENERAL_WALLET_ID!,
    address: process.env.GENERAL_WALLET_ADDRESS!,
  },
  summary: {
    id: process.env.SUMMARY_WALLET_ID!,
    address: process.env.SUMMARY_WALLET_ADDRESS!,
  },
};

export interface MediSwarmResult {
  report: Awaited<ReturnType<typeof generateSummaryReport>>;
  transactions: {
    total: number;
    totalUSDC: string;
    details: { from: string; to: string; amount: string; state: string; explorer: string }[];
  };
  agentBalances: Record<string, string>;
}

export async function runMediSwarm(symptoms: string): Promise<MediSwarmResult> {
  console.log("\n╔════════════════════════════════════╗");
  console.log("║        🏥 MediSwarm Online          ║");
  console.log("╚════════════════════════════════════╝");
  console.log(`\n📋 Patient: "${symptoms}"\n`);

  const allTransactions: MediSwarmResult["transactions"]["details"] = [];

  // ── Step 1: Triage ──────────────────────────────────────────────────────
  const triage = await triagePatient(symptoms, AGENT_WALLETS.triage.id);

  for (const p of triage.payments) {
    allTransactions.push({
      from: "Triage Agent",
      to: p.to,
      amount: p.amount,
      state: p.state,
      explorer: p.explorerUrl,
    });
  }

  // ── Step 2: Specialist Consultations (sequential to avoid rate limits) ──
  const consultations = [];
  for (const specialist of triage.specialistsNeeded) {
    const wallet = AGENT_WALLETS[specialist as keyof typeof AGENT_WALLETS];
    const result = await runSpecialistConsultation(
      specialist,
      symptoms,
      wallet?.id ?? AGENT_WALLETS.general.id,
      AGENT_WALLETS.summary.address
    );
    consultations.push(result);
  }

  for (const c of consultations) {
    if (c.paymentToSummary) {
      allTransactions.push({
        from: `${c.specialist} Agent`,
        to: "Summary Agent",
        amount: c.paymentToSummary.amount,
        state: c.paymentToSummary.state,
        explorer: c.paymentToSummary.explorerUrl,
      });
    }
  }

  // ── Step 3: Summary Report ───────────────────────────────────────────────
  const report = await generateSummaryReport(symptoms, consultations);

  // ── Step 4: Collect Balances ─────────────────────────────────────────────
  const agentBalances: Record<string, string> = {};
  for (const [name, wallet] of Object.entries(AGENT_WALLETS)) {
    if (wallet.id) {
      agentBalances[name] = await getBalance(wallet.id);
    }
  }

  const totalUSDC = allTransactions
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    .toFixed(6);

  console.log("\n╔════════════════════════════════════╗");
  console.log(`║  ✅ Done! ${allTransactions.length} transactions fired     ║`);
  console.log("╚════════════════════════════════════╝\n");

  return {
    report,
    transactions: {
      total: allTransactions.length,
      totalUSDC,
      details: allTransactions,
    },
    agentBalances,
  };
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────
const symptoms =
  process.argv[2] ??
  "I have been experiencing chest tightness, shortness of breath, and occasional dizziness for the past 3 days";

runMediSwarm(symptoms)
  .then((result) => {
    console.log("\n🗂️  FINAL REPORT:");
    console.log(JSON.stringify(result.report, null, 2));
    console.log("\n💰 TRANSACTION SUMMARY:");
    console.log(`Total: ${result.transactions.total} on-chain transactions`);
    console.log(`Total USDC: $${result.transactions.totalUSDC}`);
    result.transactions.details.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.from} → ${t.to}: ${t.amount} USDC [${t.state}]`);
    });
  })
  .catch(console.error);