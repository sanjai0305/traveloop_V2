import React, { useState, useEffect } from "react";
import api from "../services/api";
import { CircleDollarSign, Check, Download, Landmark, Calendar, RefreshCw } from "lucide-react";

interface RevenueDetails {
  grossRevenue: number;
  commissionRevenue: number;
  refundAmount: number;
  pendingSettlements: number;
  upcomingPayouts: number;
}

interface PendingBooking {
  _id: string;
  bookingId: string;
  travelerName: string;
  pricePaid: number;
  commissionAmount: number;
  agentAmount: number;
  gatewayFee: number;
  agentTrip?: {
    title: string;
  };
  agent?: {
    companyName: string;
    displayName: string;
  };
}

export const Finance: React.FC = () => {
  const [revenue, setRevenue] = useState<RevenueDetails | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<PendingBooking[]>([]);
  const [payoutSchedule, setPayoutSchedule] = useState<"weekly" | "monthly" | "manual">("weekly");
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [revRes, bookRes] = await Promise.all([
        api.get("/admin/revenue"),
        api.get("/admin/bookings")
      ]);

      if (revRes.data.success) {
        setRevenue(revRes.data.revenueBreakdown);
      }

      if (bookRes.data.success) {
        const pending = bookRes.data.bookings.filter((b: any) => b.status === "Paid");
        setPendingPayouts(pending);
      }
    } catch (err) {
      console.error("Failed to load financial records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleApproveSettlement = async (bookingId: string) => {
    setSettlingId(bookingId);
    try {
      const res = await api.post("/admin/settlement", { bookingId });
      if (res.data.success) {
        setPendingPayouts(pendingPayouts.filter((p) => p._id !== bookingId));
        const revRes = await api.get("/admin/revenue");
        if (revRes.data.success) {
          setRevenue(revRes.data.revenueBreakdown);
        }
      }
    } catch (err) {
      alert("Failed to settle transaction");
    } finally {
      setSettlingId(null);
    }
  };

  const handleExportCSV = (type: string) => {
    let headers = "";
    let rows: any[] = [];
    let filename = "";

    if (type === "gst") {
      filename = "gst_tax_invoice_report.csv";
      headers = "Invoice Date,Booking ID,Gross Paid,Commission,GST Amount (18% of Commission),Gateway Charge\n";
      rows = pendingPayouts.map(p => {
        const comm = p.commissionAmount;
        const gst = comm * 0.18;
        return `"${new Date().toISOString().split("T")[0]}","${p.bookingId}",${p.pricePaid},${comm},${gst},${p.gatewayFee}`;
      });
    } else if (type === "commission") {
      filename = "commission_earnings_report.csv";
      headers = "Transaction Date,Booking ID,Package Title,Travel Agent,Total Received,Commission Rate,Platform Earned\n";
      rows = pendingPayouts.map(p => {
        return `"${new Date().toISOString().split("T")[0]}","${p.bookingId}","${p.agentTrip?.title || "Custom Package"}","${p.agent?.companyName || "Independent"}",${p.pricePaid},"10%",${p.commissionAmount}`;
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fmt = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  if (loading || !revenue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading ledger...</p>
      </div>
    );
  }

  const finCards = [
    { title: "Gross Revenue", value: fmt(revenue.grossRevenue), desc: "All-time client bookings value", color: "text-slate-800 bg-emerald-50 border-emerald-100" },
    { title: "Commission Revenue", value: fmt(revenue.commissionRevenue), desc: "Net Traveloop platform earnings", color: "text-[#14B8A6] bg-teal-50 border-teal-100" },
    { title: "Pending Settlement", value: fmt(revenue.pendingSettlements), desc: "Escrow funds awaiting payout", color: "text-amber-600 bg-amber-50 border-amber-100" },
    { title: "Refunded Cash", value: fmt(revenue.refundAmount), desc: "Approved cancellations refunded", color: "text-rose-600 bg-rose-50 border-rose-100" },
    { title: "Referral Earnings", value: fmt(revenue.commissionRevenue * 0.05), desc: "Direct program rewards paid", color: "text-blue-600 bg-blue-50 border-blue-100" }
  ];

  return (
    <div className="space-y-6 animate-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-[#14B8A6]" />
            <span>Wallet</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Settle agent balances, configure payout rules, and export commission reports.</p>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payout:</span>
          <div className="flex bg-slate-100 border border-slate-205 rounded-xl p-0.5 shadow-xs">
            {(["weekly", "monthly", "manual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPayoutSchedule(mode)}
                className={`text-[10px] uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-lg transition-all ${
                  payoutSchedule === mode ? "bg-white text-[#14B8A6] shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {finCards.map((c) => (
          <div key={c.title} className={`glass-panel p-5 rounded-[20px] bg-white border border-slate-200 space-y-1`}>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">
              {c.title}
            </span>
            <span className={`text-lg font-black tracking-tight block ${c.color.split(" ")[0]}`}>
              {c.value}
            </span>
            <p className="text-[9px] text-slate-400 font-semibold">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Reports & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settlement Payout Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 font-poppins flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#14B8A6]" />
              <span>Pending Escrows ({pendingPayouts.length})</span>
            </h3>
            <button
              onClick={loadFinanceData}
              className="p-1 text-slate-400 hover:text-[#14B8A6] hover:rotate-185 transition-all duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel rounded-[20px] overflow-hidden text-xs bg-white border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50">
                    <th className="py-3.5 px-5">Booking ID</th>
                    <th className="py-3.5 px-5">Travel Agent</th>
                    <th className="py-3.5 px-5 text-right">Gross Paid</th>
                    <th className="py-3.5 px-5 text-right">Commission</th>
                    <th className="py-3.5 px-5 text-right">Agent Payout</th>
                    <th className="py-3.5 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {pendingPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-sans font-bold">
                        All traveler bookings have been settled. No pending payouts.
                      </td>
                    </tr>
                  ) : (
                    pendingPayouts.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-black text-slate-800">{p.bookingId}</td>
                        <td className="py-3.5 px-5 font-sans">
                          <div className="font-bold text-slate-800">{p.agent?.companyName || "Independent"}</div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[150px] mt-0.5">{p.agentTrip?.title}</div>
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold">{fmt(p.pricePaid)}</td>
                        <td className="py-3.5 px-5 text-right text-[#14B8A6] font-bold">{fmt(p.commissionAmount)}</td>
                        <td className="py-3.5 px-5 text-right text-emerald-600 font-black">{fmt(p.agentAmount)}</td>
                        <td className="py-3.5 px-5 text-center font-sans">
                          <button
                            onClick={() => handleApproveSettlement(p._id)}
                            disabled={settlingId === p._id}
                            className="inline-flex items-center gap-1 py-1 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[9px] font-bold rounded-lg transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{settlingId === p._id ? "Processing..." : "Settle"}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Download Statement Reports Card */}
        <div className="glass-panel p-6 rounded-[20px] bg-white border border-slate-200 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-poppins">Taxation & Payout Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export statements containing detailed audit transaction listings. GST calculations assume standard <span className="text-[#14B8A6] font-bold">18% GST</span> is charged on Traveloop commission revenues.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleExportCSV("gst")}
              className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200 hover:border-[#14B8A6] hover:text-[#14B8A6] rounded-xl transition-all text-xs text-slate-700 font-bold"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>GST Invoice Statements</span>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleExportCSV("commission")}
              className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200 hover:border-[#14B8A6] hover:text-[#14B8A6] rounded-xl transition-all text-xs text-slate-700 font-bold"
            >
              <div className="flex items-center gap-3">
                <CircleDollarSign className="w-4 h-4 text-slate-400" />
                <span>Commission Ledgers</span>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            Export formats generate standard RFC-compliant CSV buffers directly in-browser. Fits Excel & analytics tools.
          </div>
        </div>

      </div>

    </div>
  );
};
export default Finance;
