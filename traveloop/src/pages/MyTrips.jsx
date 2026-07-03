// src/pages/MyTrips.jsx — Dual-track: Booked Packages + Personal Trips

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import {
  Map, CalendarDays, MapPin, Clock, Plus, ListChecks,
  StickyNote, Package, Compass, ChevronRight, DollarSign,
  Hotel, Bus, ShoppingBag, CheckCircle2,
  Ticket, ShieldCheck, User, QrCode
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import BottomSheet from "../components/mobile/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { subscribeUnreadCount } from "../services/chatService";

// ─── GRADIENT COVERS ──────────────────────────────────────────
const COVERS = [
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
  "linear-gradient(135deg,#FA709A,#FEE140)",
  "linear-gradient(135deg,#14B8B5,#0D9488)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
];

const DEST_EMOJIS = {
  Goa: "🏖️", Bali: "🌴", Paris: "🗼", Tokyo: "🌸",
  Maldives: "🐚", Switzerland: "🏔️", Dubai: "🌆",
  Kerala: "🌿", Manali: "❄️", Rajasthan: "🏰", default: "✈️",
};
const getEmoji = (dest = "") => {
  for (const key of Object.keys(DEST_EMOJIS)) {
    if (key !== "default" && dest.toLowerCase().includes(key.toLowerCase()))
      return DEST_EMOJIS[key];
  }
  return DEST_EMOJIS.default;
};

// ─── STATUS CONFIG ────────────────────────────────────────────
const STATUS_CONFIG = {
  upcoming:  { label: "Upcoming",  bg: "bg-blue-500",    text: "text-white" },
  ongoing:   { label: "Ongoing",   bg: "bg-emerald-500", text: "text-white" },
  completed: { label: "Completed", bg: "bg-slate-400",   text: "text-white" },
  planning:  { label: "Planning",  bg: "bg-amber-500",   text: "text-white" },
};

const getTripLifeCycleState = (booking) => {
  const trip = booking.agentTrip || {};
  const isCancelled = booking.status === "cancelled" || booking.paymentStatus === "Cancelled";
  
  if (isCancelled) {
    return {
      tripStatus: "Cancelled",
      tripStatusColor: "bg-rose-100 text-rose-800 border border-rose-200",
      qrStatus: "Expired",
      qrStatusColor: "bg-slate-105 text-slate-400 border border-slate-200",
      qrButtonText: "Cancelled",
      qrButtonDisabled: true,
      qrButtonClass: "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed",
    };
  }

  if (trip.status === "completed") {
    return {
      tripStatus: "Completed",
      tripStatusColor: "bg-slate-100 text-slate-600 border border-slate-200",
      qrStatus: "Expired",
      qrStatusColor: "bg-slate-105 text-slate-400 border border-slate-200",
      qrButtonText: "Trip Completed",
      qrButtonDisabled: true,
      qrButtonClass: "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed",
    };
  }

  const now = new Date();
  const startDateStr = trip.startDate;
  const departureTimeStr = trip.departureTime || "00:00";

  if (!startDateStr) {
    return {
      tripStatus: "Upcoming",
      tripStatusColor: "bg-blue-100 text-blue-800 border border-blue-200",
      qrStatus: "Locked",
      qrStatusColor: "bg-slate-105 text-slate-400 border border-slate-200",
      qrButtonText: "Boarding Pass Locked",
      qrButtonDisabled: true,
      qrButtonClass: "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed",
    };
  }

  const travelDate = new Date(`${startDateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = travelDate.getTime() === today.getTime();
  const isFuture = travelDate.getTime() > today.getTime();
  const isPast = travelDate.getTime() < today.getTime();

  const departureDateTime = new Date(`${startDateStr}T${departureTimeStr}:00`);
  const boardingStart = new Date(departureDateTime.getTime() - 60 * 60 * 1000);
  const boardingEnd = new Date(departureDateTime.getTime() + 30 * 60 * 1000);

  let tripStatus = "Upcoming";
  let tripStatusColor = "bg-blue-100 text-blue-800 border border-blue-200";
  let qrStatus = "Locked";
  let qrStatusColor = "bg-slate-100 text-slate-400 border border-slate-200";
  let qrButtonText = "Available on Travel Day";
  let qrButtonDisabled = true;
  let qrButtonClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";

  if (isFuture) {
    tripStatus = "Upcoming";
    tripStatusColor = "bg-blue-100 text-blue-800 border border-blue-200";
    qrStatus = "Locked";
    qrStatusColor = "bg-slate-100 text-slate-400 border border-slate-200";
    qrButtonText = "Available on Travel Day";
    qrButtonDisabled = true;
    qrButtonClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
  } else if (isPast) {
    tripStatus = "Expired";
    tripStatusColor = "bg-slate-100 text-slate-650 border border-slate-200";
    qrStatus = "Expired";
    qrStatusColor = "bg-slate-100 text-slate-400 border border-slate-200";
    qrButtonText = "Boarding Pass Expired";
    qrButtonDisabled = true;
    qrButtonClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
  } else if (isToday) {
    if (now < boardingStart) {
      tripStatus = "Today";
      tripStatusColor = "bg-teal-100 text-teal-800 border border-teal-200";
      qrStatus = "Locked";
      qrStatusColor = "bg-slate-100 text-slate-400 border border-slate-200";
      qrButtonText = "Available 1 hour before departure";
      qrButtonDisabled = true;
      qrButtonClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
    } else if (now >= boardingStart && now <= boardingEnd) {
      if (booking.boardingStatus === "boarded") {
        tripStatus = "Boarding Open";
        tripStatusColor = "bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse";
        qrStatus = "Scanned";
        qrStatusColor = "bg-emerald-100 text-emerald-850 border border-emerald-200";
        qrButtonText = "Boarded";
        qrButtonDisabled = true;
        qrButtonClass = "bg-emerald-500 text-white font-bold cursor-not-allowed shadow-md shadow-emerald-500/20";
      } else {
        tripStatus = "Boarding Open";
        tripStatusColor = "bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse";
        
        const hasGenerated = localStorage.getItem(`qr_generated_${booking._id}`) === "true";
        qrStatus = hasGenerated ? "Generated" : "Available";
        qrStatusColor = hasGenerated ? "bg-teal-100 text-teal-800 border border-teal-200" : "bg-blue-100 text-blue-800 border border-blue-200";
        qrButtonText = hasGenerated ? "View QR" : "Generate QR";
        qrButtonDisabled = false;
        qrButtonClass = "bg-teal-500 text-white font-bold hover:bg-teal-600 shadow-lg shadow-teal-500/25";
      }
    } else {
      tripStatus = "Expired";
      tripStatusColor = "bg-slate-100 text-slate-650 border border-slate-200";
      qrStatus = "Expired";
      qrStatusColor = "bg-slate-100 text-slate-400 border border-slate-200";
      qrButtonText = "Boarding Pass Expired";
      qrButtonDisabled = true;
      qrButtonClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
    }
  }

  return {
    tripStatus,
    tripStatusColor,
    qrStatus,
    qrStatusColor,
    qrButtonText,
    qrButtonDisabled,
    qrButtonClass,
  };
};

// ─── BOOKED PACKAGE CARD ──────────────────────────────────────
const BookedPackageCard = ({ booking, index }) => {
  if (!booking) return null;
  const navigate = useNavigate();
  const trip     = booking.agentTrip || {};
  const dest     = (trip.destinations || [])[0] || "Trip";
  const emoji    = getEmoji(dest);
  const cover    = COVERS[index % COVERS.length];
  const [imageError, setImageError] = useState(false);

  const days = trip.startDate && trip.endDate
    ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
    : null;

  // Calculate dynamic lifecycle state
  const {
    tripStatus,
    tripStatusColor,
    qrStatus,
    qrStatusColor,
    qrButtonText,
    qrButtonDisabled,
    qrButtonClass
  } = getTripLifeCycleState(booking);

  // Driver Assignment status
  const driverAssigned = !!(trip.driverName || trip.driverPhone || trip.driver);
  const driverStatusText = driverAssigned ? "Driver Assigned" : "Pending Assignment";
  const driverStatusColor = driverAssigned ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-250";

  // Seat Number status
  const seatAssigned = !!booking.assignedSeat;
  const seatStatusText = seatAssigned ? `Seat ${booking.assignedSeat}` : "Waiting For Driver Assignment";
  const seatStatusColor = seatAssigned ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200";

  // Cancellation deadlines
  const allowCancellation = trip.allowCancellation !== false;
  const cancellationDeadlineStr = trip.cancellationUntilDate ? `${trip.cancellationUntilDate}T${trip.cancellationUntilTime || "18:00"}:00` : null;
  const cancellationDeadline = cancellationDeadlineStr ? new Date(cancellationDeadlineStr) : null;
  const isCancellable = allowCancellation && cancellationDeadline && new Date() < cancellationDeadline;

  // Format dates
  const bookingDateFormatted = booking.bookingDate 
    ? new Date(booking.bookingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const travelDateFormatted = trip.startDate
    ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const ACTIONS = [
    { icon: ListChecks,  label: "Itinerary",  tab: "itinerary",  color: "text-teal-600",   bg: "bg-teal-50" },
    { icon: Hotel,       label: "Hotel",       tab: "hotel",      color: "text-blue-600",   bg: "bg-blue-50" },
    { icon: Bus,         label: "Transport",   tab: "transport",  color: "text-amber-600",  bg: "bg-amber-50" },
    { icon: ShoppingBag, label: "Packing",     tab: "packing",    color: "text-violet-600", bg: "bg-violet-50" },
    { icon: DollarSign,  label: "Budget",      tab: "budget",     color: "text-rose-600",   bg: "bg-rose-50" },
    { icon: StickyNote,  label: "Notes",       tab: "notes",      color: "text-slate-600",  bg: "bg-slate-50" },
  ];

  const handleOpen = (tab = "itinerary", extraState = {}) => {
    navigate(`/my-bookings/${booking._id}`, { state: { tab, ...extraState } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileTap={{ scale: 0.985 }}
      className="premium-card overflow-hidden cursor-pointer bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300"
      onClick={() => handleOpen("itinerary")}
    >
      {/* ── COVER ── */}
      <div className="relative h-44 overflow-hidden" style={{ background: cover }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl">{emoji}</span>
        </div>
        {trip.coverImage && !imageError && (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={() => setImageError(true)}
          />
        )}
        <div
          className="absolute inset-0 z-20"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 65%)" }}
        />

        {/* Booked Package badge */}
        <div className="absolute top-4 left-4 z-30">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold text-white shadow-lg backdrop-blur-md"
            style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
          >
            <Package size={11} />
            Booked Package
          </div>
        </div>

        {/* Agency Verified badge */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-extrabold shadow-lg backdrop-blur-md">
          <ShieldCheck size={11} />
          Agency Verified
        </div>

        {/* Trip info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
          <h3 className="text-white font-extrabold text-xl leading-tight truncate">
            {trip.title || "Booked Trip"}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={13} className="text-white/80 flex-shrink-0" />
              <span className="text-white/85 text-xs truncate max-w-[170px]">{dest}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
              <Ticket size={11} className="text-teal-300" />
              <span className="text-white text-[10px] font-mono font-extrabold">{booking.bookingId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAIL FIELD GRID ── */}
      <div className="p-4 grid grid-cols-2 gap-3 text-xs border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Agency</span>
          <span className="font-bold text-slate-700 truncate">{trip.agent?.companyName || "Traveloop Partner"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Booking Date</span>
          <span className="font-bold text-slate-700">{bookingDateFormatted}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Travel Date</span>
          <span className="font-bold text-slate-700">{travelDateFormatted}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Duration</span>
          <span className="font-bold text-slate-700">{days ? `${days} Days` : "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Reporting / Departure</span>
          <span className="font-bold text-slate-700">{trip.reportingTime || "—"} / {trip.departureTime || "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Pickup Point</span>
          <span className="font-bold text-slate-700 truncate">{booking.pickupLocation || trip.pickupLocation || "Main Station"}</span>
        </div>
      </div>

      {/* ── STATUS BADGES ROW ── */}
      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-slate-100 bg-white">
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${tripStatusColor} uppercase tracking-wider`}>
          Trip: {tripStatus}
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${qrStatusColor} uppercase tracking-wider`}>
          QR: {qrStatus}
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${seatStatusColor} uppercase tracking-wider`}>
          {seatStatusText}
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${driverStatusColor} uppercase tracking-wider`}>
          {driverStatusText}
        </div>
        <div className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-teal-200 bg-teal-50 text-teal-800 uppercase tracking-wider">
          Payment: {booking.paymentStatus || "Paid"}
        </div>
      </div>

      {/* ── CANCELLATION & BOARDING PASS ACTION AREA ── */}
      <div className="px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cancellation Deadline</span>
            {cancellationDeadline ? (
              <span className={`font-semibold ${isCancellable ? "text-amber-600" : "text-slate-500"}`}>
                {cancellationDeadline.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} @ {cancellationDeadline.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className="font-semibold text-slate-500">Non-Refundable</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isCancellable ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-150 text-emerald-800 border border-emerald-200 uppercase">
                Refund Eligible
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-150 text-slate-500 border border-slate-200 uppercase">
                Cancellation Closed
              </span>
            )}
          </div>
        </div>

        {/* Boarding Pass button triggers generation or shows details */}
        <div className="flex gap-2 w-full">
          <button
            type="button"
            disabled={qrButtonDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (qrButtonText === "Generate QR") {
                localStorage.setItem(`qr_generated_${booking._id}`, "true");
                handleOpen("itinerary", { generateQr: true });
              } else {
                handleOpen("itinerary", { generateQr: true });
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-[14px] text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 ${qrButtonClass}`}
          >
            <QrCode size={14} />
            {qrButtonText}
          </button>

          {isCancellable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to details tab with cancel state
                handleOpen("itinerary", { initiateCancel: true });
              }}
              className="px-4 py-2.5 rounded-[14px] text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors"
            >
              Cancel Trip
            </button>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="px-3 py-3 grid grid-cols-6 gap-1.5 bg-white">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.88 }}
              onClick={e => { e.stopPropagation(); handleOpen(action.tab); }}
              className={`flex flex-col items-center gap-1 py-2 rounded-[12px] ${action.bg} ${action.color} transition-all min-h-[48px]`}
              aria-label={`Open ${action.label}`}
            >
              <Icon size={14} />
              <span className="text-[9px] font-bold leading-tight text-center">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─── PERSONAL TRIP CARD ───────────────────────────────────────
const PersonalTripCard = ({ trip, index, onClick, onStatusClick, unreadCount }) => {
  if (!trip) return null;
  const navigate = useNavigate();
  const status   = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planning;
  const cover    = COVERS[index % COVERS.length];
  const emoji    = getEmoji(trip.destination);
  const [imageError, setImageError] = useState(false);

  const days = trip.startDate && trip.endDate
    ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
    : null;

  const daysLeft = trip.startDate
    ? Math.max(0, Math.ceil((new Date(trip.startDate) - new Date()) / 86400000))
    : null;

  const ACTIONS = [
    { icon: ListChecks, label: "Itinerary",  path: `/build-itinerary/${trip._id}`,   color: "text-teal-600",   bg: "bg-teal-50" },
    { icon: Package,    label: "Packing",    path: `/packing-checklist/${trip._id}`, color: "text-amber-600",  bg: "bg-amber-50" },
    { icon: DollarSign, label: "Budget",     path: `/trip-budget/${trip._id}`,       color: "text-rose-600",   bg: "bg-rose-50" },
    { icon: StickyNote, label: "Notes",      path: `/trip-notes/${trip._id}`,        color: "text-violet-600", bg: "bg-violet-50" },
    { icon: Compass,    label: "Activities", path: `/activities/${trip._id}`,        color: "text-blue-600",   bg: "bg-blue-50" },
  ];

  const isShared  = trip.collaborators && trip.collaborators.some(c => c.acceptedAt !== null);
  const userRole  = trip.role || "owner";
  const badgeText = isShared
    ? `Shared • ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`
    : (userRole === "owner" ? "" : userRole.charAt(0).toUpperCase() + userRole.slice(1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileTap={{ scale: 0.985 }}
      className="premium-card overflow-hidden cursor-pointer"
      onClick={() => onClick(trip)}
    >
      {/* ── COVER ── */}
      <div className="relative h-44 overflow-hidden" style={{ background: cover }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl">{emoji}</span>
        </div>
        {trip.image && !imageError && (
          <img
            src={trip.image}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={() => setImageError(true)}
          />
        )}
        <div className="absolute inset-0 z-20" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%)" }} />

        {/* Trip type badge — Personal Trip / Booked Package */}
        <div className="absolute top-4 left-4 z-30">
          {trip.tripType === "booked" ? (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
            >
              <Package size={10} />
              Booked Package
            </div>
          ) : (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
            >
              <User size={10} />
              Personal Trip
            </div>
          )}
        </div>

        {/* Status badge */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStatusClick(trip._id, trip.status || "planning"); }}
          className={`absolute top-4 right-4 z-30 px-3 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text} shadow-xs active:scale-95 transition-all`}
          aria-label={`Change status for ${trip.title}`}
        >
          {status.label}
        </button>

        {/* Days left pill */}
        {daysLeft !== null && daysLeft > 0 && (
          <div className="absolute top-[52px] left-4 z-30 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-700">{daysLeft}d to go</span>
          </div>
        )}

        {/* Trip name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
          <h3 className="text-white font-extrabold text-lg leading-tight" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {trip.title}
          </h3>
          <div className="flex items-center justify-between gap-1.5 mt-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={12} className="text-white/70 flex-shrink-0" />
              <span className="text-white/70 text-xs truncate max-w-[140px]">{trip.destination}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {badgeText && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 text-white border border-white/10 uppercase tracking-wider backdrop-blur-xs">
                  {badgeText}
                </span>
              )}
              {(unreadCount > 0 || (!unreadCount && trip.unreadCount > 0)) && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white border border-rose-400 uppercase tracking-wider">
                  💬 {unreadCount || trip.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO ROW ── */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-50">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
          {trip.startDate && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs flex-shrink-0">
              <CalendarDays size={12} className="text-teal-500" />
              <span>{new Date(trip.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
            </div>
          )}
          {days && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs flex-shrink-0">
              <Clock size={12} className="text-violet-500" />
              <span>{days} days</span>
            </div>
          )}
          {trip.budget && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 flex-shrink-0">
              <DollarSign size={12} />
              <span>₹{trip.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="px-3 py-3 flex gap-2">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.88 }}
              onClick={e => { e.stopPropagation(); navigate(action.path); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-[14px] ${action.bg} ${action.color} transition-all min-h-[48px]`}
              aria-label={`Open ${action.label} for ${trip.title}`}
            >
              <Icon size={16} />
              <span className="text-[10px] font-semibold">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─── TAB CONFIG ───────────────────────────────────────────────
const TABS = [
  { key: "all",       label: "All" },
  { key: "upcoming",  label: "⏰ Upcoming" },
  { key: "today",     label: "📅 Today" },
  { key: "completed", label: "✅ Completed" },
  { key: "cancelled", label: "🚫 Cancelled" },
  { key: "personal",  label: "✏️ Personal" },
  { key: "booked",    label: "📦 Booked Packages" },
];

// ─── MY TRIPS PAGE ────────────────────────────────────────────
const MyTrips = () => {
  const navigate = useNavigate();
  const { user, isInitialized, firebaseUser } = useAuth();

  const [personalTrips,   setPersonalTrips]   = useState([]);
  const [bookedPackages,  setBookedPackages]  = useState([]);
  const [bookedTripPlans, setBookedTripPlans] = useState([]); // Cloned Trip records from agent packages
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [activeTab,       setActiveTab]       = useState("all");
  const [selectedTripForStatus, setSelectedTripForStatus] = useState(null);
  const [unreadCounts,    setUnreadCounts]    = useState({});

  // ── Unread chat subscriptions (personal trips only)
  useEffect(() => {
    if (!user || personalTrips.length === 0 || !isInitialized || !firebaseUser) return;
    const unsubscribes = personalTrips.map(t =>
      subscribeUnreadCount(t._id, user.id || user._id, (count) => {
        setUnreadCounts(prev => ({ ...prev, [t._id]: count }));
      })
    );
    return () => unsubscribes.forEach(u => u());
  }, [personalTrips, user, isInitialized, firebaseUser]);

  // ── Update personal trip status
  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPersonalTrips(prev => prev.map(t => (t._id === tripId ? { ...t, status: newStatus } : t)));
        setSelectedTripForStatus(null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // ── Fetch both trip types in parallel
  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [personalRes, bookedRes] = await Promise.all([
        fetch(getApiUrl("trips"), { headers }),
        fetch(getApiUrl("bookings/my-bookings"), { headers }),
      ]);

      const [personalData, bookedData] = await Promise.all([
        personalRes.json().catch(() => ({})),
        bookedRes.json().catch(() => ({})),
      ]);

      const trips = personalData?.trips || [];
      const bookings = bookedData?.bookings || bookedData?.data || [];

      setPersonalTrips((trips || []).filter(t => t && (!t.tripType || t.tripType === "manual")));
      setBookedTripPlans((trips || []).filter(t => t && t.tripType === "booked"));
      setBookedPackages(bookings || []);
    } catch (err) {
      console.error("[MyTrips fetchAll] Error loading trips/bookings:", err);
      setPersonalTrips([]);
      setBookedTripPlans([]);
      setBookedPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchAll();
    window.addEventListener("refreshTrips", fetchAll);
    return () => window.removeEventListener("refreshTrips", fetchAll);
  }, [fetchAll]);

  // ── Helper to check if a travel date is today
  const isTripToday = (startDateStr) => {
    if (!startDateStr) return false;
    const travelDate = new Date(`${startDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return travelDate.getTime() === today.getTime();
  };

  // ── Helper to check if a travel date is in the future
  const isTripUpcoming = (startDateStr) => {
    if (!startDateStr) return false;
    const travelDate = new Date(`${startDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return travelDate.getTime() > today.getTime();
  };

  // ── Filter logic per tab
  const filterPersonal = (trips) => trips.filter(t => {
    if (!t) return false;
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    // Filter by tab
    if (activeTab === "all") return true;
    if (activeTab === "personal") return true;
    if (activeTab === "today") return isTripToday(t.startDate);
    if (activeTab === "upcoming") return isTripUpcoming(t.startDate);
    if (activeTab === "completed") return (t.status || "").includes("completed");
    if (activeTab === "cancelled") return (t.status || "").includes("cancelled");
    return false;
  });

  const filterBooked = (bookings) => bookings.filter(b => {
    if (!b) return false;
    const trip = b.agentTrip || {};
    const dest = (trip.destinations || [])[0] || "";
    const matchSearch =
      (trip.title || "").toLowerCase().includes(search.toLowerCase()) ||
      dest.toLowerCase().includes(search.toLowerCase()) ||
      (b.bookingId || "").toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    // Is it soft-deleted?
    const isDeletedTrip = b.tripDeleted || trip.isDeleted || trip.status === "deleted";
    if (isDeletedTrip) return false;

    const isCancelled = b.status === "cancelled" || b.paymentStatus === "Cancelled";

    // Filter by tab
    if (activeTab === "all") return !isCancelled;
    if (activeTab === "booked") return !isCancelled;
    if (activeTab === "today") return !isCancelled && isTripToday(trip.startDate);
    if (activeTab === "upcoming") return !isCancelled && isTripUpcoming(trip.startDate);
    if (activeTab === "completed") return !isCancelled && (trip.status || "").includes("completed");
    if (activeTab === "cancelled") return isCancelled;
    return false;
  });

  // Filter booked-type Trip plans (cloned from agent packages)
  const filterBookedPlans = (trips) => trips.filter(t => {
    if (!t) return false;
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    // Ensure it belongs to a booking that is currently visible in the active tab (or confirmed in general)
    const linkedBooking = bookedPackages.find(b => b && ((b.userTripId?._id || b.userTripId) === t._id || b._id === t.bookingId));
    if (!linkedBooking) return false;

    const isCancelled = linkedBooking.status === "cancelled" || linkedBooking.paymentStatus === "Cancelled";

    if (activeTab === "all") return !isCancelled;
    if (activeTab === "booked") return !isCancelled;
    if (activeTab === "today") return !isCancelled && isTripToday(t.startDate);
    if (activeTab === "upcoming") return !isCancelled && isTripUpcoming(t.startDate);
    if (activeTab === "completed") return !isCancelled && (t.status || "").includes("completed");
    if (activeTab === "cancelled") return isCancelled;
    return false;
  });

  const showBooked   = ["all", "booked", "today", "upcoming", "completed", "cancelled"].includes(activeTab);
  const showPersonal = ["all", "personal", "today", "upcoming", "completed", "cancelled"].includes(activeTab);

  const visibleBooked      = showBooked   ? filterBooked(bookedPackages)       : [];
  const visibleBookedPlans = showBooked   ? filterBookedPlans(bookedTripPlans) : [];
  const visiblePersonal    = showPersonal ? filterPersonal(personalTrips)      : [];
  const totalCount         = visibleBooked.length + visibleBookedPlans.length + visiblePersonal.length;

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-8">

        {/* ── Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3.5 mb-4 rounded-[18px] bg-white border border-slate-200 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all duration-200"
        >
          <Map size={18} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trips, destinations, booking ID..."
            className="flex-1 bg-transparent text-slate-700 text-sm font-medium placeholder:text-slate-400 outline-none"
            aria-label="Search trips and destinations"
          />
        </motion.div>

        {/* ── Tab Strip ── */}
        <div className="chip-row mb-5 -mx-4 px-4">
          {TABS.map((tab, i) => (
            <motion.button
              key={tab.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.90 }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "text-white shadow-brand"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
              style={activeTab === tab.key ? { background: "linear-gradient(135deg, #14B8B5, #0D9488)" } : {}}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="premium-card overflow-hidden">
                <div className="h-44 skeleton" />
                <div className="p-4">
                  <div className="h-4 skeleton rounded-lg w-3/4 mb-2" />
                  <div className="h-3 skeleton rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : totalCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-5"
          >
            <div
              className="w-24 h-24 rounded-[28px] flex items-center justify-center text-5xl"
              style={{ background: "linear-gradient(135deg, rgba(20,184,181,0.1), rgba(20,184,181,0.05))" }}
            >
              🗺️
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-slate-700">
                {personalTrips.length === 0 && bookedPackages.length === 0 ? "No trips yet" : "No results"}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {personalTrips.length === 0 && bookedPackages.length === 0
                  ? "Start planning your first adventure!"
                  : "Try a different search or tab"}
              </p>
            </div>
            {personalTrips.length === 0 && bookedPackages.length === 0 && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/create-trip")}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full text-white font-bold shadow-brand"
                style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
              >
                <Plus size={18} />
                Plan a Trip
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {/* Booked Packages section */}
              {visibleBooked.length > 0 && (
                <>
                  {activeTab === "all" && (
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                      >
                        <Package size={11} />
                        Booked Packages ({visibleBooked.length})
                      </div>
                    </div>
                  )}
                  {visibleBooked.map((booking, i) => (
                    <BookedPackageCard key={`${booking._id || booking.id || i}-${i}`} booking={booking} index={i} />
                  ))}
                </>
              )}

              {/* Booked Trip Plans section — cloned planner trips from agent packages */}
              {visibleBookedPlans.length > 0 && (
                <>
                  {activeTab === "all" && (
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}
                      >
                        <ListChecks size={11} />
                        Trip Planners ({visibleBookedPlans.length})
                      </div>
                    </div>
                  )}
                  {visibleBookedPlans.map((trip, i) => (
                    <PersonalTripCard
                      key={`${trip._id || trip.id || i}-${i}`}
                      trip={trip}
                      index={i}
                      unreadCount={unreadCounts[trip._id] || 0}
                      onStatusClick={(id, curStatus) => setSelectedTripForStatus({ id, status: curStatus })}
                      onClick={() => navigate(`/build-itinerary/${trip._id}`)}
                    />
                  ))}
                </>
              )}

              {/* Personal Trips section */}
              {visiblePersonal.length > 0 && (
                <>
                  {activeTab === "all" && (
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
                      >
                        <CheckCircle2 size={11} />
                        Personal Trips ({visiblePersonal.length})
                      </div>
                    </div>
                  )}
                  {visiblePersonal.map((trip, i) => (
                    <PersonalTripCard
                      key={`${trip._id || trip.id || i}-${i}`}
                      trip={trip}
                      index={i}
                      unreadCount={unreadCounts[trip._id] || 0}
                      onStatusClick={(id, curStatus) => setSelectedTripForStatus({ id, status: curStatus })}
                      onClick={() => navigate(`/build-itinerary/${trip._id}`)}
                    />
                  ))}
                </>
              )}

            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Status Picker Bottom Sheet */}
      <BottomSheet
        isOpen={selectedTripForStatus !== null}
        onClose={() => setSelectedTripForStatus(null)}
        title="Update Trip Status"
        snapPoints={["40vh"]}
      >
        <div className="space-y-3">
          {Object.keys(STATUS_CONFIG).map((key) => {
            const cfg = STATUS_CONFIG[key];
            const isSelected = selectedTripForStatus?.status === key;
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpdateStatus(selectedTripForStatus.id, key)}
                className={`w-full flex items-center justify-between p-4 rounded-[20px] border transition-colors ${
                  isSelected
                    ? "border-teal-400 bg-teal-50/30 text-teal-800"
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="text-sm font-bold">{cfg.label}</span>
                <span className={`w-3.5 h-3.5 rounded-full ${cfg.bg}`} />
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>
    </MainLayout>
  );
};

export default MyTrips;
