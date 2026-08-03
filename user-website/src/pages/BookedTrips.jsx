// src/pages/BookedTrips.jsx — Dedicated Booked Packages & Marketplace Reservations Page

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import {
  Ticket, CalendarDays, Compass, DollarSign,
  Download, XCircle, Users, Building2,
  ArrowRight, MessageSquare, QrCode, X, ShieldCheck
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import { useAuth } from "../context/AuthContext";
import { socket } from "../utils/socket";

const COVERS = [
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
  "linear-gradient(135deg,#FA709A,#FEE140)",
  "linear-gradient(135deg,#14B8B5,#0D9488)",
];

const TABS = [
  { key: "all",       label: "All Bookings" },
  { key: "upcoming",  label: "⏰ Upcoming" },
  { key: "ongoing",   label: "🚀 Ongoing" },
  { key: "completed", label: "✅ Completed" },
  { key: "cancelled", label: "🚫 Cancelled" },
];

const BookedTrips = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQrBooking, setSelectedQrBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("bookings/my"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || data.data || []);
      } else {
        const fallbackRes = await fetch(getApiUrl("bookings/my-bookings"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fallbackData = await fallbackRes.json();
        setBookings(fallbackData.bookings || fallbackData.data || []);
      }
    } catch (err) {
      console.error("Error fetching booked trips:", err);
      toast.error("Failed to load booked trips.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    window.addEventListener("refreshTrips", fetchBookings);
    return () => window.removeEventListener("refreshTrips", fetchBookings);
  }, [fetchBookings]);

  useEffect(() => {
    if (!bookings || bookings.length === 0) return;

    bookings.forEach(b => {
      const tripId = b.tripId || b.agentTrip?._id;
      if (tripId) {
        socket.emit("join_room", tripId.toString());
      }
    });

    const handleBoardingOpened = (data) => {
      setBookings(prev => prev.map(b => {
        const tripId = b.tripId || b.agentTrip?._id;
        if (tripId && tripId.toString() === data.tripId?.toString()) {
          return { ...b, qrUnlocked: true, boardingStatus: "OPEN", status: "Ready for Travel" };
        }
        return b;
      }));
    };

    const handleBoardingClosed = (data) => {
      setBookings(prev => prev.map(b => {
        const tripId = b.tripId || b.agentTrip?._id;
        if (tripId && tripId.toString() === data.tripId?.toString()) {
          return { ...b, qrUnlocked: false, boardingStatus: "CLOSED" };
        }
        return b;
      }));
    };

    const handleCheckedIn = (data) => {
      setBookings(prev => prev.map(b => {
        if (b.bookingId === data.bookingId || b._id === data.bookingDbId) {
          return { ...b, status: "Checked In" };
        }
        return b;
      }));
    };

    socket.on("boarding-opened", handleBoardingOpened);
    socket.on("boarding-closed", handleBoardingClosed);
    socket.on("passenger_checked_in", handleCheckedIn);

    return () => {
      socket.off("boarding-opened", handleBoardingOpened);
      socket.off("boarding-closed", handleBoardingClosed);
      socket.off("passenger_checked_in", handleCheckedIn);
    };
  }, [bookings]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`bookings/${bookingId}/cancel`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Booking cancelled successfully!");
        fetchBookings();
      } else {
        toast.error(data.message || "Failed to cancel booking.");
      }
    } catch (err) {
      toast.error("Error cancelling booking.");
    }
  };

  const handleDownloadInvoice = async (booking) => {
    const toastId = toast.loading("Downloading PDF ticket/invoice...");
    try {
      const token = localStorage.getItem("token");
      const bId = booking.bookingId || booking._id;
      const res = await fetch(getApiUrl(`bookings/${bId}/pdf`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ticket_${bId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded!");
    } catch (err) {
      toast.error("Invoice download failed.");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!b) return false;
    const trip = b.agentTrip || {};
    const title = trip.title || b.tripTitle || b.packageTitle || "";
    const agent = trip.agent?.companyName || b.agentName || "";
    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      agent.toLowerCase().includes(search.toLowerCase()) ||
      (b.bookingId || "").toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    const isCancelled = b.status === "cancelled" || b.status === "Cancelled" || b.paymentStatus === "Cancelled" || b.paymentStatus === "cancelled";
    const startDate = trip.startDate || b.startDate || b.travelDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isUpcoming = false;
    let isToday = false;
    let isPast = false;

    if (startDate) {
      const d = new Date(startDate);
      d.setHours(0, 0, 0, 0);
      isUpcoming = d > today;
      isToday = d.getTime() === today.getTime();
      isPast = d < today;
    }

    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return !isCancelled && isUpcoming;
    if (activeTab === "ongoing") return !isCancelled && (isToday || trip.status === "ongoing");
    if (activeTab === "completed") return !isCancelled && (isPast || trip.status === "completed");
    if (activeTab === "cancelled") return isCancelled;

    return true;
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <Ticket size={16} /> Purchased Packages & Reservations
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Booked Trips
                </h1>
                <p className="text-slate-300 text-sm mt-1 max-w-xl">
                  Manage your tour agent bookings, travel tickets, invoices, group chat, and boarding passes in one place.
                </p>
              </div>

              <button
                onClick={() => navigate("/activities")}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all w-full md:w-auto"
              >
                <Compass size={18} />
                Explore Packages
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar mt-8 pt-4 border-t border-white/10">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                      : "bg-white/10 text-slate-300 hover:bg-white/15"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-2.5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Ticket size={18} className="text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search by package name, agent, or booking ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading your booked packages...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm my-8 flex flex-col items-center justify-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
                <Ticket size={36} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">No Booked Trips Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  {search
                    ? `No bookings match "${search}". Try clearing your search filter.`
                    : "You haven't purchased any travel packages yet. Explore curated tour packages and marketplace deals to get started!"}
                </p>
              </div>
              <button
                onClick={() => navigate("/activities")}
                className="mt-2 px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Compass size={16} /> Explore Marketplace
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.map((booking, idx) => {
                const trip = booking.agentTrip || {};
                const title = trip.title || booking.tripTitle || booking.packageTitle || "Travel Package";
                const agentName = trip.agent?.companyName || booking.agentName || "Traveloop Partner";
                const isCancelled = booking.status === "cancelled" || booking.status === "Cancelled" || booking.paymentStatus === "Cancelled" || booking.paymentStatus === "cancelled";
                const cover = COVERS[idx % COVERS.length];

                const travelDateStr = trip.startDate || booking.startDate || booking.travelDate;
                const travelDateFormatted = travelDateStr
                  ? new Date(travelDateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "Flexible";

                const isCancellable = !isCancelled && (booking.paymentStatus === "Paid" || booking.paymentStatus === "PAID") && (trip.allowCancellation !== false);
                const tripIdForChat = trip._id || booking.tripId || booking.agentTrip;

                return (
                  <motion.div
                    key={booking._id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="p-5 text-white relative overflow-hidden" style={{ background: cover }}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-teal-500/90 text-white text-[11px] font-black tracking-wider uppercase backdrop-blur-md shadow-sm">
                          🎫 Package Booking
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                          isCancelled
                            ? "bg-rose-500 text-white border-rose-400"
                            : booking.status === "Checked In"
                            ? "bg-emerald-500 text-white border-emerald-400"
                            : "bg-blue-500 text-white border-blue-400"
                        }`}>
                          {isCancelled ? "Cancelled" : booking.status || "Confirmed"}
                        </span>
                      </div>

                      <h3 className="text-lg font-black leading-tight drop-shadow-sm truncate mt-1">{title}</h3>
                      <div className="flex items-center justify-between text-xs text-white/90 font-medium mt-1">
                        <span className="flex items-center gap-1"><Building2 size={13} /> {agentName}</span>
                        <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-[10px]">{booking.bookingId || "BOOKING"}</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 space-y-3 text-xs">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CalendarDays size={14} className="text-teal-500" /> Travel Date
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">{travelDateFormatted}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users size={14} className="text-violet-500" /> Traveler Count
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {booking.seats || booking.travellers?.length || 1} Traveler(s)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5 font-medium">
                          <DollarSign size={14} className="text-emerald-500" /> Amount Paid
                        </span>
                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                          ₹{new Intl.NumberFormat("en-IN").format(booking.pricePaid || booking.totalAmount || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Payment Status</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          isCancelled ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {booking.paymentStatus || "Paid"}
                        </span>
                      </div>
                    </div>

                    {/* Group Chat Shortcut */}
                    {tripIdForChat && !isCancelled && (
                      <div className="px-4 py-2 bg-teal-50/60 dark:bg-teal-950/30 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => navigate(`/trip-chat/${tripIdForChat}`)}
                          className="w-full py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                        >
                          <MessageSquare size={14} />
                          💬 Trip Group Chat
                        </button>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/booking/${booking.bookingId || booking._id}`)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      >
                        View Booking <ArrowRight size={13} />
                      </button>

                      <button
                        onClick={() => setSelectedQrBooking(booking)}
                        className="py-2.5 px-3 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-teal-100 active:scale-95 transition-all"
                        title="Boarding Pass QR"
                      >
                        <QrCode size={14} />
                      </button>

                      <button
                        onClick={() => handleDownloadInvoice(booking)}
                        className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
                        title="Download Invoice PDF"
                      >
                        <Download size={14} />
                      </button>

                      {isCancellable && (
                        <button
                          onClick={() => handleCancelBooking(booking._id || booking.bookingId)}
                          className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-rose-100 active:scale-95 transition-all"
                          title="Cancel Booking"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Encrypted Boarding Pass QR Modal */}
        <AnimatePresence>
          {selectedQrBooking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setSelectedQrBooking(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative text-center"
              >
                <button
                  onClick={() => setSelectedQrBooking(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center justify-center gap-2 text-teal-600 dark:text-teal-400 font-black text-xs uppercase tracking-widest mb-1">
                  <ShieldCheck size={16} /> Encrypted Digital Pass
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  Boarding QR Code
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Show this QR code to your bus driver or tour agent for check-in.
                </p>

                <div className="my-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                  <img
                    src={getApiUrl(`bookings/${selectedQrBooking.bookingId || selectedQrBooking._id}/qr`)}
                    alt="Encrypted Boarding Pass QR Code"
                    className="w-48 h-48 rounded-xl bg-white p-2 border border-slate-200"
                    onError={(e) => {
                      // Fallback placeholder if image error
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-3">
                    ID: {selectedQrBooking.bookingId || selectedQrBooking._id}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>✔ Digitally Signed & Encrypted Token</p>
                  <p>✔ Valid for Driver Check-In</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

export default BookedTrips;
