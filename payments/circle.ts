import {
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

export interface PaymentResult {
  transactionId: string;
  state: string;
  explorerUrl: string;
  amount: string;
  from: string;
  to: string;
}

export async function sendAgentPayment(
  fromWalletId: string,
  toAddress: string,
  amount: string,
  memo?: string
): Promise<PaymentResult> {
  console.log(`💸 Payment: ${amount} USDC → ${toAddress.slice(0, 10)}... [${memo ?? ""}]`);

  const response = await client.createTransaction({
    walletId: fromWalletId,
    blockchain: "ARC-TESTNET",
    tokenAddress: "0x3600000000000000000000000000000000000000",
    destinationAddress: toAddress,
    amounts: [amount],
    fee: {
      type: "level",
      config: { feeLevel: "MEDIUM" },
    },
  });

  const tx = response.data?.transaction;
  const txId = tx?.id;

  if (!txId) {
    return {
      transactionId: "unknown",
      state: "INITIATED",
      explorerUrl: "",
      amount,
      from: fromWalletId,
      to: toAddress,
    };
  }

  let state = tx?.state ?? "INITIATED";
  let txHash = tx?.txHash ?? "";
  let attempts = 0;

  while (!["COMPLETE", "FAILED", "CANCELLED"].includes(state) && attempts < 15) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await client.getTransaction({ id: txId });
    state = statusRes.data?.transaction?.state ?? state;
    txHash = statusRes.data?.transaction?.txHash ?? txHash;
    attempts++;
  }

  return {
    transactionId: txId,
    state,
    explorerUrl: txHash ? `https://testnet.arcscan.app/tx/${txHash}` : "",
    amount,
    from: fromWalletId,
    to: toAddress,
  };
}

export async function getBalance(walletId: string): Promise<string> {
  const res = await client.getWalletTokenBalance({ id: walletId });
  const usdc = res.data?.tokenBalances?.find((b) =>
    b.token?.symbol?.includes("USDC")
  );
  return usdc?.amount ?? "0";
}

export async function createAgentWallet(name: string): Promise<{ id: string; address: string }> {
  const res = await client.createWallets({
    blockchains: ["ARC-TESTNET"],
    count: 1,
    walletSetId: process.env.CIRCLE_WALLET_SET_ID!,
    metadata: [{ name, refId: name }],
  });
  const wallet = res.data?.wallets?.[0]!;
  return { id: wallet.id!, address: wallet.address! };
}