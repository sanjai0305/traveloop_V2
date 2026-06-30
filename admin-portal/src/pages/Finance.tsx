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
        // filter bookings where status is "Paid" (meaning paid by traveler, but not settled to agent)
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
        // Remove from pending list
        setPendingPayouts(pendingPayouts.filter((p) => p._id !== bookingId));
        // Refresh revenue stats
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

  // Export CSV generator helper
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
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading general ledger balances...</p>
      </div>
    );
  }

  const finCards = [
    { title: "Gross Platform Volume", value: fmt(revenue.grossRevenue), desc: "All-time client payments", color: "text-white" },
    { title: "Commission Revenue", value: fmt(revenue.commissionRevenue), desc: "Net Traveloop platform earnings", color: "text-teal-400" },
    { title: "Refunded Cash", value: fmt(revenue.refundAmount), desc: "Approved cancellations refunded", color: "text-rose-400" },
    { title: "Pending Settlements", value: fmt(revenue.pendingSettlements), desc: "Escrow funds awaiting payout", color: "text-amber-400" },
    { title: "Upcoming Weekly Payout", value: fmt(revenue.upcomingPayouts), desc: "Next scheduled auto-transfer", color: "text-cyan-400" }
  ];

  return (
    <div className="space-y-8 animate-page">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-white flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-teal-400" />
            <span>General Ledger & Payout Controls</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure payout rules, download GST statements, and settle agent escrows.</p>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">Payout System:</span>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(["weekly", "monthly", "manual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPayoutSchedule(mode)}
                className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md transition-all ${
                  payoutSchedule === mode ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
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
          <div key={c.title} className="glass-panel p-5 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              {c.title}
            </span>
            <span className={`text-xl font-extrabold font-mono tracking-tight block ${c.color}`}>
              {c.value}
            </span>
            <p className="text-[9px] text-slate-500">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Reports & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settlement Payout Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-white font-poppins flex items-center gap-2">
              <Landmark className="w-5 h-5 text-teal-400" />
              <span>Pending Escrows ({pendingPayouts.length})</span>
            </h3>
            <button
              onClick={loadFinanceData}
              className="p-1 text-slate-400 hover:text-teal-400 hover:rotate-180 transition-all duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-900/40">
                    <th className="py-3 px-5">Booking ID</th>
                    <th className="py-3 px-5">Travel Agent</th>
                    <th className="py-3 px-5 text-right">Gross Paid</th>
                    <th className="py-3 px-5 text-right">Commission</th>
                    <th className="py-3 px-5 text-right">Agent Payout</th>
                    <th className="py-3 px-5 text-center">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                  {pendingPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                        All traveler booking escrows have been settled. No pending payouts.
                      </td>
                    </tr>
                  ) : (
                    pendingPayouts.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-white">{p.bookingId}</td>
                        <td className="py-3.5 px-5 font-sans">
                          <div className="font-semibold">{p.agent?.companyName || "Independent"}</div>
                          <div className="text-[9px] text-slate-500">{p.agentTrip?.title}</div>
                        </td>
                        <td className="py-3.5 px-5 text-right">{fmt(p.pricePaid)}</td>
                        <td className="py-3.5 px-5 text-right text-teal-400">{fmt(p.commissionAmount)}</td>
                        <td className="py-3.5 px-5 text-right text-emerald-400 font-bold">{fmt(p.agentAmount)}</td>
                        <td className="py-3.5 px-5 text-center font-sans">
                          <button
                            onClick={() => handleApproveSettlement(p._id)}
                            disabled={settlingId === p._id}
                            className="inline-flex items-center gap-1 py-1 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[10px] font-bold rounded-lg transition-colors"
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
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-bold text-white font-poppins">Taxation & Commission Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export audits containing detailed transaction listings. GST reports assume <span className="text-teal-400 font-semibold">18% GST</span> is charged on Traveloop commission revenues.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleExportCSV("gst")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 hover:border-teal-500/40 rounded-xl hover:text-teal-400 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-200">GST Invoice Statements</span>
              </div>
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleExportCSV("commission")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 hover:border-teal-500/40 rounded-xl hover:text-teal-400 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <CircleDollarSign className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-200">Commission Ledgers</span>
              </div>
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[10px] text-slate-500">
            Export formats generate standard RFC-compliant CSV buffers directly in-browser. Fits Excel & BI engines.
          </div>
        </div>

      </div>

    </div>
  );
};
