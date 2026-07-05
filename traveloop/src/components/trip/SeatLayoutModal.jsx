/**
 * SeatLayoutModal.jsx — Premium Volvo Sleeper Bus Seat Selection
 *
 * - Renders driver cabin, entry door, full seat grid
 * - Colour-codes seats by status (available/reserved/booked male/booked female/selected)
 * - Tooltips on booked seats show Passenger Name, Gender, Age
 * - Listens to Socket.IO seat_update events for live cross-user sync
 * - Shows availability counters: Available / Male / Female / Reserved
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Users, Bus, DoorOpen, Check, AlertTriangle, Loader2,
  User, RefreshCw, Info
} from "lucide-react";
import { io as socketIO } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "../../utils/api";

// ─── SEAT STATUS COLOURS ──────────────────────────────────────────────────────

const SEAT_STYLES = {
  available: {
    bg: "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600",
    text: "text-slate-700 dark:text-slate-300",
    hover: "hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 cursor-pointer",
    label: "Available",
  },
  selected: {
    bg: "bg-blue-500 border-blue-600",
    text: "text-white",
    hover: "cursor-pointer",
    label: "Selected",
  },
  reserved: {
    bg: "bg-amber-100 border-amber-400 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    hover: "cursor-not-allowed",
    label: "Reserved",
  },
  booked_male: {
    bg: "bg-sky-100 border-sky-400 dark:bg-sky-900/40",
    text: "text-sky-700 dark:text-sky-300",
    hover: "cursor-pointer",
    label: "Male",
  },
  booked_female: {
    bg: "bg-pink-100 border-pink-400 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-300",
    hover: "cursor-pointer",
    label: "Female",
  },
};

const getSeatStyle = (seat, isSelected) => {
  if (isSelected) return SEAT_STYLES.selected;
  if (seat.status === "reserved") return SEAT_STYLES.reserved;
  if (seat.status === "booked") {
    return seat.gender === "Female" ? SEAT_STYLES.booked_female : SEAT_STYLES.booked_male;
  }
  return SEAT_STYLES.available;
};

// ─── INDIVIDUAL SEAT CELL ─────────────────────────────────────────────────────

const SeatCell = ({ seat, isSelected, onClick, disabled }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const style = getSeatStyle(seat, isSelected);
  const isBooked = seat.status === "booked";
  const isReserved = seat.status === "reserved";

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={() => !disabled && onClick(seat)}
        onMouseEnter={() => isBooked && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={disabled || isBooked || isReserved}
        className={`
          relative w-10 h-10 rounded-lg border-2 flex flex-col items-center justify-center
          text-[9px] font-extrabold transition-all duration-150 select-none
          ${style.bg} ${style.text} ${style.hover}
          ${isSelected ? "scale-105 shadow-lg shadow-blue-500/30 ring-2 ring-blue-300" : ""}
          ${isBooked || isReserved ? "opacity-90" : "active:scale-95"}
        `}
        title={seat.seatNumber}
      >
        {/* Seat icon */}
        {isSelected ? (
          <Check size={12} className="mb-px" />
        ) : isBooked ? (
          <User size={10} className="mb-px opacity-70" />
        ) : (
          <div className="w-6 h-3.5 rounded-t border border-current opacity-40 mb-px" />
        )}
        <span className="leading-none">{seat.seatNumber}</span>

        {/* Reserved indicator dot */}
        {isReserved && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white animate-pulse" />
        )}
      </button>

      {/* Hover Tooltip for booked seats */}
      <AnimatePresence>
        {showTooltip && isBooked && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-[10px] shadow-2xl border border-slate-700 whitespace-nowrap min-w-[130px]">
              <div className="font-black text-[11px] text-teal-400 mb-1">Seat {seat.seatNumber}</div>
              <div className="space-y-0.5 opacity-90">
                {seat.passengerName && <div>👤 {seat.passengerName}</div>}
                {seat.gender && <div>⚧ {seat.gender}</div>}
                {seat.age > 0 && <div>🎂 {seat.age} years</div>}
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const SeatLayoutModal = ({
  trip,
  requiredSeats,       // number of seats user must select
  onConfirm,           // (selectedSeats: string[]) => void
  onClose,
}) => {
  const [seats, setSeats] = useState([]);
  const [counters, setCounters] = useState({ available: 0, male: 0, female: 0, reserved: 0 });
  const [layout, setLayout] = useState({ rows: [], seatsPerRow: 4 });
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);

  // ── Fetch seat map ──────────────────────────────────────────────────────────
  const fetchSeats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`seats/${trip._id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSeats(data.seats || []);
        setCounters(data.counters || {});
        setLayout(data.layout || { rows: [], seatsPerRow: 4 });
      } else {
        setError(data.message || "Failed to load seat map");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [trip._id]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // ── Socket.IO live seat updates ─────────────────────────────────────────────
  useEffect(() => {
    const socketUrl = getSocketUrl ? getSocketUrl() : import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = socketIO(socketUrl, { transports: ["polling", "websocket"] });

    socket.on("connect", () => {
      socket.emit("join_trip_seats", trip._id);
    });

    socket.on("seat_update", (update) => {
      if (update.tripId !== String(trip._id)) return;
      setSeats((prev) =>
        prev.map((s) =>
          s.seatNumber === update.seatNumber
            ? {
                ...s,
                status: update.status,
                gender: update.gender ?? s.gender,
                passengerName: update.passengerName ?? s.passengerName,
                age: update.age ?? s.age,
                reservedUntil: update.reservedUntil ?? s.reservedUntil,
              }
            : s
        )
      );
      // Recompute counters
      setSeats((prev) => {
        const c = {
          total: prev.length,
          available: prev.filter((x) => x.status === "available").length,
          reserved: prev.filter((x) => x.status === "reserved").length,
          booked: prev.filter((x) => x.status === "booked").length,
          male: prev.filter((x) => x.status === "booked" && x.gender === "Male").length,
          female: prev.filter((x) => x.status === "booked" && x.gender === "Female").length,
        };
        setCounters(c);
        return prev;
      });
    });

    return () => {
      socket.emit("leave_trip_seats", trip._id);
      socket.disconnect();
    };
  }, [trip._id]);

  // ── Seat click handler ──────────────────────────────────────────────────────
  const handleSeatClick = (seat) => {
    if (seat.status === "booked" || seat.status === "reserved") return;

    setSelected((prev) => {
      if (prev.includes(seat.seatNumber)) {
        return prev.filter((s) => s !== seat.seatNumber);
      }
      if (prev.length >= requiredSeats) {
        // Deselect the first selected and add new
        return [...prev.slice(1), seat.seatNumber];
      }
      return [...prev, seat.seatNumber];
    });
  };

  // ── Reserve seats + call onConfirm ─────────────────────────────────────────
  const handleConfirm = async () => {
    if (selected.length !== requiredSeats) return;

    setReserving(true);
    const token = localStorage.getItem("token");
    const failedSeats = [];

    for (const seatNumber of selected) {
      try {
        const res = await fetch(getApiUrl("seats/reserve"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tripId: trip._id, seatNumber }),
        });
        const data = await res.json();
        if (!data.success) {
          failedSeats.push(seatNumber);
        }
      } catch {
        failedSeats.push(seatNumber);
      }
    }

    setReserving(false);

    if (failedSeats.length > 0) {
      setError(`Seat(s) ${failedSeats.join(", ")} could not be reserved (taken by another user). Please reselect.`);
      setSelected((prev) => prev.filter((s) => !failedSeats.includes(s)));
      fetchSeats();
      return;
    }

    onConfirm(selected);
  };

  // ── Build rows for rendering ────────────────────────────────────────────────
  const seatsByRow = layout.rows.reduce((acc, row) => {
    acc[row] = seats.filter((s) => s.row === row).sort((a, b) => a.col - b.col);
    return acc;
  }, {});

  const progress = (selected.length / requiredSeats) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 pt-5 pb-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bus size={16} className="text-teal-500" />
              Select Your Seats
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select {requiredSeats} seat{requiredSeats > 1 ? "s" : ""} · {trip.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Counters */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Available", value: counters.available, color: "text-emerald-500" },
              { label: "Male", value: counters.male, color: "text-sky-500" },
              { label: "Female", value: counters.female, color: "text-pink-500" },
              { label: "Reserved", value: counters.reserved, color: "text-amber-500" },
            ].map((c) => (
              <div key={c.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 text-center border border-slate-100 dark:border-slate-700">
                <div className={`text-base font-black ${c.color}`}>{c.value ?? 0}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1">
            {[
              { color: "bg-white border-slate-300", label: "Available" },
              { color: "bg-blue-500 border-blue-600", label: "Selected" },
              { color: "bg-sky-100 border-sky-400", label: "Booked (M)" },
              { color: "bg-pink-100 border-pink-400", label: "Booked (F)" },
              { color: "bg-amber-100 border-amber-400", label: "Reserved" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded border-2 ${l.color}`} />
                <span className="text-[10px] text-slate-500 font-semibold">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200/60 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Bus Layout */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Loading seat map...</span>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">

              {/* Driver Cabin */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dashed border-slate-300 dark:border-slate-600">
                <div className="flex-1 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Driver</span>
                  <div className="w-5 h-5 rounded-full bg-slate-400 dark:bg-slate-500" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <DoorOpen size={10} className="text-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Entry</span>
                </div>
              </div>

              {/* Seat rows */}
              <div className="space-y-2">
                {layout.rows.map((row) => {
                  const rowSeats = seatsByRow[row] || [];
                  const leftSeats = rowSeats.filter((s) => s.col <= 2);
                  const rightSeats = rowSeats.filter((s) => s.col > 2);
                  return (
                    <div key={row} className="flex items-center gap-2">
                      {/* Row label */}
                      <span className="w-4 text-[9px] font-black text-slate-400 text-center">{row}</span>

                      {/* Left seats */}
                      <div className="flex gap-1.5">
                        {leftSeats.map((seat) => (
                          <SeatCell
                            key={seat.seatNumber}
                            seat={seat}
                            isSelected={selected.includes(seat.seatNumber)}
                            onClick={handleSeatClick}
                            disabled={reserving}
                          />
                        ))}
                      </div>

                      {/* Aisle */}
                      <div className="w-6 border-l-2 border-dashed border-slate-300 dark:border-slate-600 h-8 mx-1" />

                      {/* Right seats */}
                      <div className="flex gap-1.5">
                        {rightSeats.map((seat) => (
                          <SeatCell
                            key={seat.seatNumber}
                            seat={seat}
                            isSelected={selected.includes(seat.seatNumber)}
                            onClick={handleSeatClick}
                            disabled={reserving}
                          />
                        ))}
                      </div>

                      {/* Berth indicator */}
                      <span className="text-[8px] text-slate-300 dark:text-slate-600 ml-auto">
                        {row <= "E" ? "L" : "U"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bus tail */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="h-px w-8 bg-slate-300 dark:bg-slate-600" />
                  Rear
                  <div className="h-px w-8 bg-slate-300 dark:bg-slate-600" />
                </div>
              </div>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={fetchSeats}
            disabled={loading}
            className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mx-auto hover:text-teal-500 transition-colors"
          >
            <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            Refresh seat map
          </button>

          {/* Info tip */}
          <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <Info size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">
              Selected seats are temporarily reserved for 10 minutes. Complete payment to confirm.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pb-6 pt-3 space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                {selected.length} / {requiredSeats} seat{requiredSeats > 1 ? "s" : ""} selected
              </span>
              {selected.length > 0 && (
                <span className="text-[10px] text-teal-500 font-bold">
                  {selected.join(", ")}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", damping: 20 }}
              />
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={selected.length !== requiredSeats || reserving}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              selected.length === requiredSeats && !reserving
                ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/30 active:scale-98"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
          >
            {reserving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Reserving seats...
              </>
            ) : (
              <>
                <Check size={14} />
                Confirm {selected.length > 0 ? `Seat${selected.length > 1 ? "s" : ""} (${selected.join(", ")})` : "Seats"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SeatLayoutModal;
