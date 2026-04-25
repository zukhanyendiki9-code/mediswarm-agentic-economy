# MediSwarm: Agentic Medical Consultation Economy

**Built for the Agentic Economy on Arc Hackathon 2026**

![MediSwarm](https://img.shields.io/badge/Built%20on-Arc%20%2B%20Circle-blue)
![Status](https://img.shields.io/badge/Status-Live%20Demo-success)
![Solo](https://img.shields.io/badge/Developer-Solo-orange)

## Overview

MediSwarm is an autonomous multi-agent diagnostic system where specialized AI medical agents operate as independent economic actors. Instead of one AI trying to handle everything, specialist agents (Cardiology, Neurology, Pulmonology, Gastroenterology) consult, debate, and **pay each other in real-time** using Circle Nanopayments on the Arc blockchain.

**Total consultation cost: $0.016 USDC** (vs. $200+ traditional)

## The Problem

Traditional AI medical consultation:
- Monolithic models trying to do everything
- Single point of failure for accuracy
- No peer review or validation
- Expensive at scale ($200+ per consultation)

## The Solution

MediSwarm implements a **Diagnostic Value Loop**:

1. **Triage Agent** analyzes symptoms and routes to specialists
2. **Specialist Agents** (Cardiology, Neurology, etc.) provide expert opinions
3. **Agents pay each other** for consultations (0.003-0.005 USDC)
4. **Summary Agent** compiles peer-reviewed diagnosis
5. **All transactions settle on Arc** in <1 second

## Why Arc?

On traditional blockchains, gas fees ($20-$50) would destroy the economics of sub-cent payments. Arc makes this viable through:

- ⚡ **Sub-second finality** - Deterministic settlement
- 💰 **USDC as native gas** - Predictable, dollar-denominated fees
- 🔒 **No volatile crypto** needed for gas
- 🌐 **EVM-compatible** - Standard tooling works

## Technology Stack

**Blockchain & Payments:**
- Arc Testnet (L1 settlement)
- Circle Nanopayments (sub-cent transactions)
- Circle Wallets (agent wallet infrastructure)
- USDC (native gas & payment currency)

**AI & Intelligence:**
- DeepSeek V3 (medical reasoning)
- Featherless AI (API provider)

**Backend:**
- Node.js + Express
- Server-Sent Events (real-time streaming)

**Frontend:**
- Vanilla JavaScript
- HTML/CSS (dashboard visualization)

## Key Features

### Economic Firewall
The Triage agent acts as a safety mechanism - it doesn't just route, it **protects diagnostic integrity** by excluding agents that would give dangerous or unnecessary advice while optimizing for lowest USDC spend.

### Adversarial Accuracy
Agents peer-review each other's findings. Economic incentives ensure quality - bad diagnoses don't get paid.

### Real Agent-to-Agent Commerce
Every consultation triggers real on-chain USDC transactions. 50+ blockchain transactions during testing.

## Demo Statistics

- **Cost per diagnosis:** $0.016 USDC
- **Settlement time:** <1 second
- **Transactions completed:** 50+ on Arc Testnet
- **Agents active:** 7 (Triage, 4 specialists, General Practice, Summary)
- **Development time:** 6 days (solo)

## Installation & Setup

### Prerequisites
- Node.js 16+
- Circle Developer Account
- Arc Testnet wallet addresses

### Environment Variables

Create a `.env` file:

```env
# Circle Wallet IDs and Addresses
TRIAGE_WALLET_ID=your_triage_wallet_id
TRIAGE_WALLET_ADDRESS=0x...

CARDIOLOGY_WALLET_ID=your_cardiology_wallet_id
CARDIOLOGY_WALLET_ADDRESS=0x...

NEUROLOGY_WALLET_ID=your_neurology_wallet_id
NEUROLOGY_WALLET_ADDRESS=0x...

PULMONOLOGY_WALLET_ID=your_pulmonology_wallet_id
PULMONOLOGY_WALLET_ADDRESS=0x...

GASTRO_WALLET_ID=your_gastro_wallet_id
GASTRO_WALLET_ADDRESS=0x...

GENERAL_WALLET_ID=your_general_wallet_id
GENERAL_WALLET_ADDRESS=0x...

SUMMARY_WALLET_ID=your_summary_wallet_id
SUMMARY_WALLET_ADDRESS=0x...

# DeepSeek API (via Featherless)
FEATHERLESS_API_KEY=your_featherless_api_key
```

### Installation

```bash
npm install
node server.js
```

Open `http://localhost:3000/dashboard.html`

## How It Works

1. Enter patient symptoms in the dashboard
2. Triage agent analyzes and routes to relevant specialists
3. Watch real-time payments flow between agents
4. Specialists consult and peer-review findings
5. Summary agent compiles final diagnosis
6. All transactions verified on Arc blockchain

## Economic Proof

**Transaction Breakdown:**
- Triage → Specialist routing: $0.005 USDC each
- Specialist → Summary fee: $0.003 USDC each
- **Total**: $0.016 USDC for multi-specialist consultation

**Why traditional chains fail:**
- Ethereum gas: ~$20-50 per transaction
- 4-6 transactions per diagnosis
- Total cost: $80-300 in gas alone
- **MediSwarm total: $0.016** ✓

## Hackathon Compliance

✅ **Real per-action pricing:** ≤ $0.01 per agent interaction  
✅ **Transaction frequency:** 50+ on-chain transactions  
✅ **Margin explanation:** Only viable on Arc (gas would exceed payment value elsewhere)  
✅ **Agent-to-Agent Payment Loop:** True machine-to-machine commerce  
✅ **Usage-Based Compute Billing:** Pay per consultation, per specialist

## Verification

**Arc Testnet Explorer:**
View all transactions at: https://testnet.arcscan.app/

Search for any wallet address from the .env file to verify on-chain settlement.

## Future Improvements

- Multi-language support for global accessibility
- Integration with real medical databases
- Specialist agent reputation scoring
- Dynamic pricing based on complexity
- Additional specialist domains (Orthopedics, Dermatology, etc.)

## License

MIT License - Built for Agentic Economy on Arc Hackathon 2026

## Acknowledgments

- **Circle** - Nanopayments infrastructure
- **Arc** - Purpose-built L1 for stablecoin finance
- **Featherless AI** - DeepSeek API access
- **lablab.ai** - Hackathon platform

## Contact

Built solo by [Your Name]  
[Your Twitter/Email if you want]

---

**MediSwarm proves that expert services can be unbundled into economically viable, high-frequency agent transactions. Medical consultations don't have to cost hundreds of dollars - they can cost pennies.**
