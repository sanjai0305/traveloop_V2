import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  ArrowUpRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { GlassCard, Button, Modal } from "../components/ui";
import { getWalletStats, requestWithdrawal, getWithdrawals } from "../services/walletService";
import { formatCurrency, formatDate } from "../utils";

export const Wallet: React.FC = () => {
  const queryClient = useQueryClient();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: wallet, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["wallet-stats"],
    queryFn: getWalletStats,
    refetchInterval: 5000,
  });

  const { data: withdrawals, isLoading: historyLoading } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: getWithdrawals,
    refetchInterval: 5000,
  });

  const withdrawMutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: (data) => {
      setSuccessMsg(data.message || "Withdrawal request submitted successfully!");
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ["wallet-stats"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      setTimeout(() => {
        setWithdrawModalOpen(false);
        setSuccessMsg("");
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to submit withdrawal request.");
    },
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const amt = Number(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Please enter a valid positive number.");
      return;
    }
    if (wallet && wallet.withdrawableBalance < amt) {
      setErrorMsg("Insufficient withdrawable balance.");
      return;
    }
    withdrawMutation.mutate(amt);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-550 dark:bg-emerald-950/20 text-emerald-500 font-extrabold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-extrabold px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/50">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-500 font-extrabold px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/50">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Heading ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Wallet & Revenue
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-555 mt-1 font-semibold">
            Track commissions, split earnings, wallet balance, and payouts ledger.
          </p>
        </div>
        <Button
          onClick={() => setWithdrawModalOpen(true)}
          className="flex items-center gap-2"
          disabled={!wallet || wallet.withdrawableBalance <= 0}
        >
          <ArrowUpRight className="w-4 h-4" /> Request Payout
        </Button>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : statsError ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-500 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading wallet stats: {statsError.message}</span>
        </div>
      ) : wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                  Withdrawable Balance
                </span>
                <h3 className="text-2xl font-extrabold text-slate-850 dark:text-slate-150 mt-1">
                  {formatCurrency(wallet.withdrawableBalance || 0)}
                </h3>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-955/20 text-amber-500 flex items-center justify-center animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                  Pending Payouts
                </span>
                <h3 className="text-2xl font-extrabold text-slate-855 dark:text-slate-150 mt-1">
                  {formatCurrency(wallet.pendingBalance || 0)}
                </h3>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                  Total Agent Earnings
                </span>
                <h3 className="text-2xl font-extrabold text-slate-855 dark:text-slate-150 mt-1">
                  {formatCurrency(wallet.balance || 0)}
                </h3>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── Transaction Ledger & Withdrawals Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Ledger */}
        <div className="xl:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">Earnings Transaction Ledger</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Booking ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Admin Comm.</th>
                    <th className="pb-3 text-right">Net Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                  {wallet?.transactions && wallet.transactions.length > 0 ? (
                    wallet.transactions.map((tx: any, idx: number) => (
                      <tr key={tx._id || idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                        <td className="py-3">{formatDate(tx.date)}</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-205">{tx.bookingId}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-400">{tx.customerName}</td>
                        <td className="py-3 text-right font-bold text-slate-600 dark:text-slate-400">{formatCurrency(tx.amount)}</td>
                        <td className="py-3 text-right text-rose-500 font-bold">-{formatCurrency(tx.commission)}</td>
                        <td className="py-3 text-right text-emerald-500 font-extrabold">+{formatCurrency(tx.netEarnings)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No transactions recorded. Create a trip with bookings to earn revenue!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Withdrawal History */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-855 dark:text-slate-150">Withdrawal History</h3>
            </div>

            <div className="space-y-4">
              {historyLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                </div>
              ) : withdrawals && withdrawals.length > 0 ? (
                withdrawals.map((w: any) => (
                  <div
                    key={w._id}
                    className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-850 border border-slate-100 dark:border-slate-850 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-550 block">
                        {formatDate(w.createdAt)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205 mt-0.5">
                        {formatCurrency(w.amount)}
                      </h4>
                    </div>
                    {getStatusBadge(w.status)}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                  No withdrawals requested yet.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Withdrawal Request Modal ── */}
      <Modal isOpen={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} title="Request Payout Withdrawal">
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-450 dark:text-slate-500">Available Balance:</span>
            <span className="text-sm font-extrabold text-emerald-500">
              {formatCurrency(wallet?.withdrawableBalance || 0)}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Withdrawal Amount (₹)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-primary transition-all"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-500 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 animate-bounce" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWithdrawModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={withdrawMutation.isPending || !withdrawAmount}
            >
              {withdrawMutation.isPending ? "Submitting..." : "Confirm Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
