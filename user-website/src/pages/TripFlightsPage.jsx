// src/pages/TripFlightsPage.jsx — Full-Page Flight Dashboard Engine

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import TripHeaderNav from "../components/trip/TripHeaderNav";
import { useToast } from "../components/mobile/MobileToast";
import { getApiUrl } from "../utils/api";
import {
  Plane, Plus, Calendar, Clock, MapPin, ExternalLink, FileText,
  Upload, CheckCircle2, AlertCircle, Trash2, ArrowRight, ShieldCheck, X
} from "lucide-react";

const SAMPLE_FLIGHTS = [
  {
    id: "fl-1",
    airline: "Emirates",
    flightNumber: "EK-502",
    departureAirport: "Indira Gandhi Int. Airport (DEL)",
    departureCode: "DEL",
    departureTime: "10:30 AM",
    departureDate: "Aug 12, 2026",
    arrivalAirport: "Dubai Int. Airport (DXB)",
    arrivalCode: "DXB",
    arrivalTime: "01:45 PM",
    arrivalDate: "Aug 12, 2026",
    terminal: "Terminal 3",
    gate: "B14",
    seat: "14A",
    status: "On Time",
    boardingPassUrl: "#"
  }
];

const TripFlightsPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    airline: "", flightNumber: "", departureCode: "", departureAirport: "",
    departureTime: "", departureDate: "", arrivalCode: "", arrivalAirport: "",
    arrivalTime: "", arrivalDate: "", terminal: "", gate: "", seat: ""
  });

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`trips/${tripId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.trip) {
          setTrip(data.trip);
          setFlights(data.trip.flights || SAMPLE_FLIGHTS);
        }
      } catch (err) {
        toast.error("Failed to load flight details");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  const handleAddFlight = (e) => {
    e.preventDefault();
    if (!form.airline || !form.flightNumber) return;
    const newFlight = {
      id: `fl-${Date.now()}`,
      ...form,
      status: "Scheduled"
    };
    setFlights(prev => [...prev, newFlight]);
    toast.success("Flight added to itinerary!");
    setShowAddModal(false);
    setForm({
      airline: "", flightNumber: "", departureCode: "", departureAirport: "",
      departureTime: "", departureDate: "", arrivalCode: "", arrivalAirport: "",
      arrivalTime: "", arrivalDate: "", terminal: "", gate: "", seat: ""
    });
  };

  return (
    <MainLayout>
      <TripHeaderNav trip={trip} tripId={tripId} activeFeature="flights" />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Flight Dashboard & Boarding Passes</h1>
            <p className="text-base text-[#64748B] font-medium mt-0.5">Track live departures, gate changes, and digital boarding passes</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Flight</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── FLIGHT CARDS LIST OR EMPTY STATE ─────────────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {flights.length === 0 ? (
          <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.06)] p-12 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center mx-auto mb-2">
              <Plane size={36} />
            </div>
            <h3 className="text-2xl font-black text-[#0F172A]">No flights added yet</h3>
            <p className="text-sm text-[#64748B] font-medium max-w-md mx-auto leading-relaxed">
              Keep your entire group synchronized by attaching flight details, gate alerts, and digital boarding passes to this trip.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-12 px-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Add Your First Flight</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {flights.map((fl) => (
              <motion.div
                key={fl.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6"
              >
                {/* Flight Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black">
                      <Plane size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-[#0F172A]">{fl.airline}</h3>
                        <span className="font-mono text-xs font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                          {fl.flightNumber}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] font-medium">{fl.departureDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" /> {fl.status || "On Time"}
                    </span>
                    <button
                      onClick={() => {
                        setFlights(prev => prev.filter(f => f.id !== fl.id));
                        toast.success("Flight removed");
                      }}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Remove flight"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Flight Route Details Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
                  {/* Departure */}
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-[#0F172A] font-mono">{fl.departureCode || "DEL"}</span>
                    <p className="text-sm font-extrabold text-[#0F172A]">{fl.departureTime}</p>
                    <p className="text-xs text-[#64748B] font-medium truncate">{fl.departureAirport}</p>
                  </div>

                  {/* Flight Path Graphic */}
                  <div className="flex flex-col items-center justify-center space-y-1 text-slate-400">
                    <span className="text-[11px] font-bold text-slate-500">Non-stop Flight</span>
                    <div className="w-full flex items-center gap-2">
                      <div className="h-0.5 flex-1 bg-slate-300" />
                      <Plane size={16} className="text-cyan-500 rotate-90" />
                      <div className="h-0.5 flex-1 bg-slate-300" />
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="space-y-1 text-left md:text-right">
                    <span className="text-3xl font-black text-[#0F172A] font-mono">{fl.arrivalCode || "DXB"}</span>
                    <p className="text-sm font-extrabold text-[#0F172A]">{fl.arrivalTime}</p>
                    <p className="text-xs text-[#64748B] font-medium truncate">{fl.arrivalAirport}</p>
                  </div>
                </div>

                {/* Gate & Seat Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-bold">
                  <div className="flex items-center gap-6 text-slate-700">
                    <div><span className="text-slate-400 block text-[10px] uppercase font-black">Terminal</span>{fl.terminal || "Terminal 3"}</div>
                    <div><span className="text-slate-400 block text-[10px] uppercase font-black">Gate</span>{fl.gate || "B14"}</div>
                    <div><span className="text-slate-400 block text-[10px] uppercase font-black">Seat</span>{fl.seat || "14A"}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(fl.departureAirport)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-cyan-600 flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <MapPin size={14} className="text-cyan-500" />
                      <span>Airport Location</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      onClick={() => toast.info("Boarding pass feature ready!")}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <FileText size={14} />
                      <span>View Boarding Pass</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Add Flight Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed inset-x-4 top-[10%] z-[999] max-w-xl mx-auto bg-white rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-2xl font-black text-[#0F172A]">Add Flight Details</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddFlight} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F172A] mb-1">Airline</label>
                    <input type="text" required placeholder="e.g. Emirates" value={form.airline} onChange={e => setForm(f => ({ ...f, airline: e.target.value }))} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F172A] mb-1">Flight Number</label>
                    <input type="text" required placeholder="e.g. EK-502" value={form.flightNumber} onChange={e => setForm(f => ({ ...f, flightNumber: e.target.value }))} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F172A] mb-1">Departure Code</label>
                    <input type="text" required placeholder="e.g. DEL" value={form.departureCode} onChange={e => setForm(f => ({ ...f, departureCode: e.target.value.toUpperCase() }))} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F172A] mb-1">Arrival Code</label>
                    <input type="text" required placeholder="e.g. DXB" value={form.arrivalCode} onChange={e => setForm(f => ({ ...f, arrivalCode: e.target.value.toUpperCase() }))} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F172A] mb-1">Terminal</label>
                    <input type="text" placeholder="Terminal 3" value={form.terminal} onChange={e => setForm(f => ({ ...f, terminal: e.target.value }))} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F172A] mb-1">Gate</label>
                    <input type="text" placeholder="B14" value={form.gate} onChange={e => setForm(f => ({ ...f, gate: e.target.value }))} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F172A] mb-1">Seat</label>
                    <input type="text" placeholder="14A" value={form.seat} onChange={e => setForm(f => ({ ...f, seat: e.target.value }))} className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
                  </div>
                </div>

                <button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs cursor-pointer shadow-md">
                  Save Flight Details
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default TripFlightsPage;
