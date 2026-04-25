/**
 * Run this ONCE to create wallets for all MediSwarm agents.
 * It will print the wallet IDs and addresses to add to your .env
 *
 * Usage: npm run setup-wallets
 */
import { createAgentWallet, sendAgentPayment } from "../payments/circle.js";

const AGENTS = [
  "cardiology",
  "neurology", 
  "pulmonology",
  "gastroenterology",
  "general",
  "summary",
];

const SEED_AMOUNT = "2"; // 2 USDC seed per specialist wallet

console.log("🏥 MediSwarm Wallet Setup");
console.log("=========================\n");

const wallets: Record<string, { id: string; address: string }> = {};

for (const agent of AGENTS) {
  console.log(`Creating wallet for ${agent} agent...`);
  const wallet = await createAgentWallet(`mediswarm-${agent}`);
  wallets[agent] = wallet;
  console.log(`✅ ${agent}: ${wallet.address}`);
}

console.log("\n\n📋 Add these to your .env file:");
console.log("================================");
for (const [agent, wallet] of Object.entries(wallets)) {
  const envKey = agent.toUpperCase().replace("GASTROENTEROLOGY", "GASTRO");
  console.log(`${envKey}_WALLET_ID=${wallet.id}`);
  console.log(`${envKey}_WALLET_ADDRESS=${wallet.address}`);
}

console.log("\n⚠️  Now fund the specialist wallets from the faucet at https://faucet.circle.com");
console.log("Or seed them from your triage wallet using the Circle Console.");
