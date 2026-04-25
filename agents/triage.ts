import OpenAI from "openai";
import { sendAgentPayment, PaymentResult } from "../payments/circle.js";

const ai = new OpenAI({
  baseURL: "https://api.featherless.ai/v1",
  apiKey: process.env.FEATHERLESS_API_KEY!,
});

export interface TriageResult {
  symptoms: string;
  severity: "low" | "medium" | "high" | "emergency";
  specialistsNeeded: string[];
  reasoning: string;
  payments: PaymentResult[];
}

const SPECIALIST_ADDRESSES: Record<string, string> = {
  cardiology: process.env.CARDIOLOGY_WALLET_ADDRESS!,
  neurology: process.env.NEUROLOGY_WALLET_ADDRESS!,
  pulmonology: process.env.PULMONOLOGY_WALLET_ADDRESS!,
  gastroenterology: process.env.GASTRO_WALLET_ADDRESS!,
  general: process.env.GENERAL_WALLET_ADDRESS!,
};

const CONSULTATION_FEE = "0.005"; // 0.5 cents per specialist

export async function triagePatient(
  symptoms: string,
  triageWalletId: string
): Promise<TriageResult> {
  console.log("\n🏥 Triage Agent: Analysing symptoms...");

  const response = await ai.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3-0324",
    messages: [
      {
        role: "system",
        content: `You are an AI triage agent in a medical network. Analyse patient symptoms and decide which specialists are needed.
        
Available specialists: cardiology, neurology, pulmonology, gastroenterology, general

Respond in JSON only:
{
  "severity": "low|medium|high|emergency",
  "specialistsNeeded": ["specialist1", "specialist2"],
  "reasoning": "brief explanation"
}`,
      },
      {
        role: "user",
        content: `Patient symptoms: ${symptoms}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(response.choices[0].message.content!);
  console.log(`📋 Severity: ${analysis.severity} | Routing to: ${analysis.specialistsNeeded.join(", ")}`);

  // Pay each specialist agent a routing fee
  const payments: PaymentResult[] = [];
  for (const specialist of analysis.specialistsNeeded) {
    const address = SPECIALIST_ADDRESSES[specialist];
    if (address) {
      console.log(`💳 Paying ${specialist} agent routing fee...`);
      const payment = await sendAgentPayment(
        triageWalletId,
        address,
        CONSULTATION_FEE,
        `Routing fee: ${specialist}`
      );
      payments.push(payment);
    }
  }

  return {
    symptoms,
    severity: analysis.severity,
    specialistsNeeded: analysis.specialistsNeeded,
    reasoning: analysis.reasoning,
    payments,
  };
}
