import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, UserCheck, AlertCircle, Search, Bus, MapPin, CheckCircle, RefreshCw, Key, Smartphone } from "lucide-react";
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
      const token = localStorage.getItem("token") || ""; // driver/user token
      const res = await fetch(getApiUrl("driver/verify-ticket"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setPassenger(data.booking);
      } else {
        setError(data.message || "No active premium ticket found matching criteria.");
      }
    } catch (err) {
      setError("Network connectivity issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkBoarded = async () => {
    if (!passenger) return;
    setBoarding(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(getApiUrl(`driver/board/${passenger.id}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seatNumber: passenger.assignedSeat }),
      });
      const data = await res.json();
      if (data.success) {
        setPassenger(prev => prev ? { ...prev, boardingStatus: "BOARDED" } : null);
        setBoardedSuccess(true);
      } else {
        setError(data.message || "Failed to mark traveler as boarded.");
      }
    } catch (err) {
      setError("Unable to process boarding check-in.");
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
          Verify Passenger Ticketing & Boarding
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
                placeholder="Enter Ticket ID (e.g. TLP-2026-123456) or Code"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 font-semibold focus:border-teal-500 outline-none transition-all"
              />
              <Search className="absolute left-4 top-4 text-slate-500" size={16} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {loading ? "Verifying Record..." : "Verify Passenger"}
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
              <span>Passenger checked in and marked as BOARDED successfully!</span>
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
              className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden space-y-5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    Verified Passenger
                  </span>
                  <h3 className="text-xl font-black text-white mt-2.5">{passenger.travelerName}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase block font-black">Seat Number</span>
                  <span className="text-lg font-black text-teal-400 font-mono">Seat {passenger.assignedSeat || "TBD"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs font-semibold">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Trip / Voyage</span>
                  <span className="text-slate-200 truncate block mt-0.5">{passenger.tripTitle}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Bus Number</span>
                  <span className="text-slate-200 block mt-0.5">{passenger.busNumber}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Boarding Point</span>
                  <span className="text-slate-200 block mt-0.5">{passenger.pickupLocation}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Contact</span>
                  <span className="text-slate-200 block mt-0.5">{passenger.phone || "—"}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-black">Boarding Status</span>
                  <span className={`text-[10px] font-black uppercase mt-1 px-2.5 py-0.5 rounded-full inline-block ${
                    passenger.boardingStatus === "BOARDED" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {passenger.boardingStatus || "Pending"}
                  </span>
                </div>

                {passenger.boardingStatus !== "BOARDED" && (
                  <button
                    onClick={handleMarkBoarded}
                    disabled={boarding}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                  >
                    {boarding ? <RefreshCw size={11} className="animate-spin" /> : <UserCheck size={11} />}
                    {boarding ? "Processing..." : "Mark Boarded"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DriverPortal;
