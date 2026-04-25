import OpenAI from "openai";
import { sendAgentPayment, PaymentResult } from "../payments/circle.js";

const ai = new OpenAI({
  baseURL: "https://api.featherless.ai/v1",
  apiKey: process.env.FEATHERLESS_API_KEY!,
});

export interface ConsultationResult {
  specialist: string;
  findings: string;
  recommendations: string[];
  urgency: "routine" | "urgent" | "immediate";
  paymentToSummary: PaymentResult | null;
}

const SPECIALIST_PROMPTS: Record<string, string> = {
  cardiology: `You are a Cardiology AI specialist agent. Analyse symptoms from a cardiac perspective. 
  Focus on: heart rhythm, chest pain, blood pressure concerns, circulation issues.`,

  neurology: `You are a Neurology AI specialist agent. Analyse symptoms from a neurological perspective.
  Focus on: headaches, dizziness, numbness, cognitive symptoms, seizure risk.`,

  pulmonology: `You are a Pulmonology AI specialist agent. Analyse symptoms from a respiratory perspective.
  Focus on: breathing difficulties, cough, oxygen levels, lung conditions.`,

  gastroenterology: `You are a Gastroenterology AI specialist agent. Analyse symptoms from a GI perspective.
  Focus on: abdominal pain, nausea, digestive issues, bowel concerns.`,

  general: `You are a General Practice AI specialist agent. Provide a holistic assessment.
  Focus on: overall health, common conditions, lifestyle factors.`,
};

const SUMMARY_FEE = "0.003"; // fee paid to summary agent

export async function runSpecialistConsultation(
  specialist: string,
  symptoms: string,
  specialistWalletId: string,
  summaryWalletAddress: string
): Promise<ConsultationResult> {
  console.log(`\n🩺 ${specialist.toUpperCase()} Agent: Consulting...`);

  const prompt = SPECIALIST_PROMPTS[specialist] ?? SPECIALIST_PROMPTS.general;

  const response = await ai.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3-0324",
    messages: [
      {
        role: "system",
        content: `${prompt}
        
Respond in JSON only:
{
  "findings": "your medical findings based on symptoms",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "urgency": "routine|urgent|immediate"
}`,
      },
      {
        role: "user",
        content: `Patient symptoms: ${symptoms}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const consultation = JSON.parse(response.choices[0].message.content!);
  console.log(`✅ ${specialist}: ${consultation.urgency} urgency`);

  // Specialist pays summary agent for compiling the report
  console.log(`💳 ${specialist} paying summary agent...`);
  let paymentToSummary: PaymentResult | null = null;
  try {
    paymentToSummary = await sendAgentPayment(
      specialistWalletId,
      summaryWalletAddress,
      SUMMARY_FEE,
      `Summary fee from ${specialist}`
    );
  } catch (e) {
    console.log(`⚠️ Payment skipped (low balance): ${e}`);
  }

  return {
    specialist,
    findings: consultation.findings,
    recommendations: consultation.recommendations,
    urgency: consultation.urgency,
    paymentToSummary,
  };
}
