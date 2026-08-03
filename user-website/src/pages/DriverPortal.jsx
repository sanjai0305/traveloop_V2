import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, UserCheck, AlertCircle, Search, Bus, MapPin, CheckCircle, RefreshCw, Key, Users, Ticket } from "lucide-react";
import { getApiUrl } from "../utils/api";

const DriverPortal = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passenger, setPassenger] = useState(null);
  const [boarding, setBoarding] = useState(false);
  const [boardedSuccess, setBoardedSuccess] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setPassenger(null);
    setBoardedSuccess(false);

    try {
      const token = localStorage.getItem("token") || "";
      let res = await fetch(getApiUrl("bookings/verify-qr"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrData: query.trim(), bookingId: query.trim() }),
      });

      let data = await res.json();

      if (!data.success) {
        // Fallback to driver/verify-ticket
        res = await fetch(getApiUrl("driver/verify-ticket"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: query.trim() }),
        });
        data = await res.json();
      }

      if (data.success && data.booking) {
        setPassenger(data.booking);
      } else {
        setError(data.message || "No active booking found matching criteria.");
      }
    } catch (err) {
      setError("Network connectivity issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!passenger) return;
    setBoarding(true);
    setError(null);

    try {
      const token = localStorage.getItem("token") || "";
      const bId = passenger._id || passenger.bookingId || passenger.id;

      let res = await fetch(getApiUrl("bookings/check-in"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId: bId }),
      });

      let data = await res.json();

      if (!data.success) {
        // Fallback to driver/board endpoint
        res = await fetch(getApiUrl(`driver/board/${bId}`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seatNumber: passenger.seatNumber || passenger.assignedSeat }),
        });
        data = await res.json();
      }

      if (data.success) {
        setPassenger(prev => prev ? { ...prev, status: "Checked In", boardingStatus: "BOARDED", isCheckedIn: true } : null);
        setBoardedSuccess(true);
      } else {
        setError(data.message || "Failed to mark traveler as checked in.");
      }
    } catch (err) {
      setError("Unable to process check-in.");
    } finally {
      setBoarding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05111E] via-[#09192A] to-[#0B2035] text-white p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-xl text-center mt-8 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <Bus className="text-teal-400" size={28} />
          Driver Boarding Portal
        </h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1.5">
          Scan & Verify Passenger Boarding Pass
        </p>
      </div>

      <div className="w-full max-w-xl space-y-6">
        {/* Verification Form Card */}
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
          <h2 className="text-sm font-black uppercase text-teal-400 tracking-wider mb-4 flex items-center gap-1.5">
            <Key size={14} /> Passenger Check-In Lookup
          </h2>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan QR token or enter Booking ID (e.g. TLP-2026-12345)"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 font-semibold focus:border-teal-500 outline-none transition-all font-mono"
              />
              <Search className="absolute left-4 top-4 text-slate-500" size={16} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {loading ? "Verifying Record..." : "Verify Boarding Pass"}
            </button>
          </form>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-2.5 text-rose-400 text-xs font-bold"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {boardedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-2.5 text-emerald-400 text-xs font-bold"
            >
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>Passenger checked in and marked as Checked In successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Passenger Card Visualizer */}
        <AnimatePresence>
          {passenger && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    Verified Booking
                  </span>
                  <h3 className="text-xl font-black text-white mt-2.5">{passenger.passengerName || passenger.travelerName}</h3>
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">ID: {passenger.bookingId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase block font-black">Seat Number</span>
                  <span className="text-lg font-black text-teal-400 font-mono">{passenger.seatNumber || passenger.assignedSeat || "Assigned"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs font-semibold">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Package Name</span>
                  <span className="text-slate-200 truncate block mt-0.5">{passenger.packageName || passenger.tripTitle}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Traveler Count</span>
                  <span className="text-slate-200 block mt-0.5 flex items-center gap-1"><Users size={12} /> {passenger.travelerCount || 1} Person(s)</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Pickup Point</span>
                  <span className="text-slate-200 block mt-0.5 flex items-center gap-1"><MapPin size={12} /> {passenger.pickupPoint || passenger.pickupLocation}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mt-0.5 ${
                    passenger.status === "Checked In" || passenger.boardingStatus === "BOARDED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}>
                    {passenger.status || passenger.boardingStatus || "Ready for Travel"}
                  </span>
                </div>
              </div>

              {passenger.status !== "Checked In" && passenger.boardingStatus !== "BOARDED" && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={boarding}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {boarding ? <RefreshCw size={16} className="animate-spin" /> : <UserCheck size={18} />}
                  {boarding ? "Checking In..." : "✅ Check In"}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DriverPortal;
