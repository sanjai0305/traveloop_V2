import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, MapPin, Armchair, CreditCard, ArrowLeft, Download } from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";

const BookingSuccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`bookings/ticket/${bookingId}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setDetails(data);
        } else {
          toast.error(data.message || "Failed to load booking details.");
        }
      } catch (err) {
        console.error("Error fetching booking success details:", err);
        toast.error("Network error loading details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl(`bookings/${bookingId}/pdf`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to download PDF ticket.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Ticket PDF downloaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to download PDF ticket.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1325] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading booking status...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-[#0B1325] text-white flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-xl font-bold text-rose-500">Booking details not found</h3>
        <p className="text-sm text-slate-400 mt-2">Could not retrieve details for ID: {bookingId}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-6 py-3 bg-teal-500 rounded-xl font-bold text-xs hover:bg-teal-650 transition-all"
        >
          Go back home
        </button>
      </div>
    );
  }

  const { booking, passengers = [] } = details;
  const seatNumbers = passengers.map(p => p.seatNumber).join(", ");
  const dateFormatted = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Flexible";

  return (
    <div className="min-h-screen bg-[#0B1325] text-white py-10 px-4 md:px-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6"
      >
        {/* Top Teal Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500" />

        {/* Animated Check Icon */}
        <div className="flex flex-col items-center justify-center text-center mt-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/30 text-teal-400"
          >
            <CheckCircle2 size={44} className="stroke-[2.5]" />
          </motion.div>
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-black mt-4 text-white"
          >
            Trip Booked Successfully!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest"
          >
            Booking Ref: {booking.bookingId}
          </motion.p>
        </div>

        {/* Summary Details Card */}
        <div className="bg-[#0B1325]/50 border border-slate-850 rounded-2xl p-4 md:p-5 space-y-4">
          <h4 className="text-[10px] font-black text-teal-450 uppercase tracking-widest border-b border-slate-800 pb-2">
            Voyage Summary
          </h4>

          <div className="grid grid-cols-1 gap-3.5 text-xs">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Journey</span>
                <span className="font-extrabold text-slate-200">{booking.tripTitle}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Departure Date</span>
                  <span className="font-extrabold text-slate-200">{dateFormatted}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Armchair size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Seats reserved</span>
                  <span className="font-black text-teal-400">{seatNumbers || "TBD"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-slate-850/50 pt-3">
              <MapPin size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Boarding Point</span>
                <span className="font-semibold text-slate-300">{booking.pickupLocation || "Main Station / Departure Bay"}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-slate-850/50 pt-3">
              <CreditCard size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Amount Paid</span>
                  <span className="font-black text-base text-emerald-400">
                    ₹{new Intl.NumberFormat("en-IN").format(booking.totalAmount)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/25">
                  Paid
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleDownloadPdf}
            className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Download size={14} className="stroke-[2.5]" />
            Download PDF Ticket Pass
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/my-trips")}
              className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs rounded-2xl transition-all"
            >
              View My Trips
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={13} />
              Dashboard
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
          A confirmation ticket PDF has been sent to your registered email.<br />
          Please present this pass at boarding. Have a wonderful journey!
        </p>
      </motion.div>
    </div>
  );
};

export default BookingSuccess;
