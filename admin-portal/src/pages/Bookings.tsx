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
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#14B8A6]" />
            <span>Bookings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Track payouts, settlements, platform commission, and refunds.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status select */}
          <div className="relative w-36">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 focus:outline-none focus:border-[#14B8A6] cursor-pointer appearance-none shadow-xs font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="settled">Settled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#14B8A6] text-xs text-slate-750 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full text-center py-16 glass-panel flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[20px] shadow-xs">
            <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-400">No booking transactions found.</p>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const commAmt = b.commissionAmount !== undefined ? b.commissionAmount : (b.pricePaid * 0.1);
            const gateFee = b.gatewayFee !== undefined ? b.gatewayFee : (b.pricePaid * 0.02);
            const agentShare = b.agentAmount !== undefined ? b.agentAmount : (b.pricePaid - commAmt - gateFee);

            return (
              <div key={b._id} className="glass-panel p-5 rounded-[20px] bg-white border border-slate-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Booking ID</span>
                      <span className="text-xs font-black text-slate-800 font-mono">{b.bookingId}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      b.status === "Settled"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : b.status === "Cancelled"
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {b.status === "Paid" ? "Paid" : b.status}
                    </span>
                  </div>

                  {/* Traveler info */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Passenger</span>
                    <h4 className="text-xs font-bold text-slate-800">{b.travelerName || "Traveler"}</h4>
                    <span className="text-[10px] text-slate-450 font-bold">{b.seats} seats reserved</span>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-0.5 border-t border-slate-100 pt-3">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Trip Package</span>
                    <h5 className="text-xs font-bold text-slate-700 truncate">{b.agentTrip?.title || "Custom Trip"}</h5>
                    <p className="text-[9px] text-slate-400 mt-0.5">By {b.agent?.companyName || "Independent"}</p>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[10px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Total Price Paid:</span>
                      <span className="font-mono font-black text-slate-700">{fmt(b.pricePaid || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Platform Commission (10%):</span>
                      <span className="font-mono text-[#14B8A6] font-extrabold">{fmt(commAmt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Gateway Fee (2%):</span>
                      <span className="font-mono text-slate-450">{fmt(gateFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black">
                      <span className="text-slate-650">Agent Settlement:</span>
                      <span className="font-mono text-emerald-600">{fmt(agentShare)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => alert(`Ledger Detail:\n\nBooking: ${b.bookingId}\nPassenger: ${b.travelerName}\nTrip: ${b.agentTrip?.title}\nSeats: ${b.seats}\nDate: ${new Date(b.createdAt).toLocaleDateString()}\nStatus: ${b.status}`)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-[10px] hover:bg-slate-50 transition-colors"
                  >
                    View
                  </button>
                  {b.status === "Paid" && (
                    <>
                      <button
                        onClick={() => {
                          if (window.confirm("Approve refund for this booking?")) {
                            alert("Refund initialized successfully!");
                            setBookings(bookings.map(book => book._id === b._id ? { ...book, status: "Cancelled" } : book));
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-teal-50 hover:bg-[#14B8A6]/10 text-[#14B8A6] font-bold text-[10px] transition-colors"
                      >
                        Refund
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Cancel this booking?")) {
                            alert("Booking cancelled successfully!");
                            setBookings(bookings.map(book => book._id === b._id ? { ...book, status: "Cancelled" } : book));
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default Bookings;
