import api from "./api";

export interface WalletStats {
  balance: number;
  pendingBalance: number;
  withdrawableBalance: number;
  transactions: Array<{
    date: string;
    bookingId: string;
    customerName: string;
    amount: number;
    commission: number;
    netEarnings: number;
    status: "Completed" | "Pending" | "Refunded";
    _id?: string;
  }>;
}

export interface WithdrawalRequest {
  _id: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  createdAt: string;
  approvedAt?: string;
}

export const getWalletStats = async (): Promise<WalletStats> => {
  const res = await api.get("/agent/wallet/stats");
  return res.data.wallet;
};

export const requestWithdrawal = async (amount: number): Promise<any> => {
  const res = await api.post("/agent/wallet/withdraw", { amount });
  return res.data;
};

export const getWithdrawals = async (): Promise<WithdrawalRequest[]> => {
  const res = await api.get("/agent/wallet/withdrawals");
  return res.data.withdrawals;
};
