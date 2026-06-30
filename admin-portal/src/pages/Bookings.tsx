import React, { useState, useEffect } from "react";
import api from "../services/api";
import { BookOpen, Search, Filter, ShieldCheck, DollarSign, Clock } from "lucide-react";

interface Booking {
  _id: string;
  bookingId: string;
  travelerName: string;
  seats: number;
  paymentStatus: string;
  status: "Paid" | "Pending" | "Settled" | "Cancelled";
  pricePaid: number;
  amountPaid: number;
  commissionAmount: number;
  agentAmount: number;
  gatewayFee: number;
  createdAt: string;
  agentTrip?: {
    title: string;
  };
  agent?: {
    companyName: string;
    displayName: string;
  };
}

export const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/bookings");
      if (res.data.success) {
        setBookings(res.data.bookings);
        setFilteredBookings(res.data.bookings);
      }
    } catch (err) {
      console.error("Failed to load bookings ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Search & Status filters
  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = bookings.filter((b) => {
      const matchSearch =
        b.bookingId.toLowerCase().includes(term) ||
        (b.travelerName || "").toLowerCase().includes(term) ||
        (b.agentTrip?.title || "").toLowerCase().includes(term) ||
        (b.agent?.companyName || "").toLowerCase().includes(term);

      const matchStatus =
        statusFilter === "all" || b.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
    setFilteredBookings(filtered);
  }, [search, statusFilter, bookings]);

  const fmt = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Compiling booking ledger transaction logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-400" />
            <span>Booking Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit commissions, gateway charges, and pending settlements.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status select */}
          <div className="relative w-36">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-teal-500 cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid (Unsettled)</option>
              <option value="settled">Settled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search ledger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900/40">
                <th className="py-4 px-6">Booking ID</th>
                <th className="py-4 px-6">Traveler</th>
                <th className="py-4 px-6">Trip Package</th>
                <th className="py-4 px-6">Travel Agent</th>
                <th className="py-4 px-6 text-right">Gross Paid</th>
                <th className="py-4 px-6 text-right">Commission</th>
                <th className="py-4 px-6 text-right">Gateway Charge</th>
                <th className="py-4 px-6 text-right">Agent Payout</th>
                <th className="py-4 px-6 text-center">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No transactions recorded matching active search and filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const commAmt = b.commissionAmount !== undefined ? b.commissionAmount : (b.pricePaid * 0.1);
                  const gateFee = b.gatewayFee !== undefined ? b.gatewayFee : (b.pricePaid * 0.02);
                  const agentShare = b.agentAmount !== undefined ? b.agentAmount : (b.pricePaid - commAmt - gateFee);

                  return (
                    <tr key={b._id} className="hover:bg-slate-900/30 transition-colors font-mono">
                      
                      {/* Booking ID */}
                      <td className="py-4 px-6 font-semibold text-white">
                        {b.bookingId}
                      </td>

                      {/* Traveler */}
                      <td className="py-4 px-6 font-sans">
                        <div className="font-semibold text-slate-200">{b.travelerName || "Traveler"}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{b.seats} seats</div>
                      </td>

                      {/* Package */}
                      <td className="py-4 px-6 font-sans">
                        <div className="font-medium text-slate-200 truncate max-w-[150px]">
                          {b.agentTrip?.title || "Custom Package"}
                        </div>
                      </td>

                      {/* Agent */}
                      <td className="py-4 px-6 font-sans">
                        <div className="font-medium text-slate-300">
                          {b.agent?.companyName || b.agent?.displayName || "Independent"}
                        </div>
                      </td>

                      {/* Gross Paid */}
                      <td className="py-4 px-6 text-right text-white font-bold">
                        {fmt(b.pricePaid || b.amountPaid || 0)}
                      </td>

                      {/* Commission */}
                      <td className="py-4 px-6 text-right text-teal-400 font-bold">
                        {fmt(commAmt)}
                      </td>

                      {/* Gateway Fee */}
                      <td className="py-4 px-6 text-right text-slate-400">
                        {fmt(gateFee)}
                      </td>

                      {/* Agent Share */}
                      <td className="py-4 px-6 text-right text-emerald-400 font-bold">
                        {fmt(agentShare)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            b.status === "Settled"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : b.status === "Cancelled"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {b.status === "Settled" ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : b.status === "Cancelled" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <DollarSign className="w-3 h-3 animate-pulse" />
                          )}
                          <span>{b.status === "Paid" ? "Paid (Pending Approval)" : b.status}</span>
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
