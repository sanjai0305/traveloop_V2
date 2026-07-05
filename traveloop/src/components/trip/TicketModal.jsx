/**
 * TicketModal.jsx — QR Boarding Ticket with Download
 *
 * - Displays per-passenger QR code (via qrcode.react)
 * - Booking ID, trip name, seat, passenger details
 * - "Download QR" button (canvas → PNG)
 * - "Download PDF Ticket" button (html2canvas + jsPDF)
 * - Swipe/tab between multiple passengers
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  X, Download, FileText, ChevronLeft, ChevronRight,
  Bus, MapPin, Calendar, User, CheckCircle2, Share2, Ticket
} from "lucide-react";

const TicketModal = ({
  bookingSummary, // { bookingId, tripTitle, startDate, pickupLocation, totalAmount }
  passengers,     // PassengerData[] with qrPayload + qrString
  trip,
  onClose,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const ticketRef = useRef(null);
  const qrCanvasRef = useRef(null);

  const active = passengers?.[activeIdx];
  const total = passengers?.length || 0;

  const qrString = active?.qrString
    || JSON.stringify(active?.qrPayload || { booking: bookingSummary?.bookingId });

  // ── Download QR as PNG ──────────────────────────────────────────────────────
  const downloadQR = () => {
    const canvas = document.getElementById(`qr-canvas-${activeIdx}`);
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `TravelLoop-QR-${active?.seatNumber || activeIdx + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Download PDF Ticket ─────────────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!ticketRef.current) return;
    setDownloadingPdf(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TravelLoop-Ticket-${bookingSummary?.bookingId || "ticket"}.pdf`);
    } catch (err) {
      console.error("[Ticket PDF] Error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!active) return null;

  const formattedDate = bookingSummary?.startDate
    ? new Date(bookingSummary.startDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto bg-slate-100 dark:bg-slate-950 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket size={16} className="text-teal-500" />
              Your Boarding Pass
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Booking #{bookingSummary?.bookingId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">CONFIRMED</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* Passenger tabs (if multiple) */}
          {total > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 disabled:opacity-40"
              >
                <ChevronLeft size={12} />
              </button>
              <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
                {passengers.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                      i === activeIdx
                        ? "bg-teal-500 border-teal-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    {p.seatNumber}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActiveIdx((i) => Math.min(total - 1, i + 1))}
                disabled={activeIdx === total - 1}
                className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 disabled:opacity-40"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Ticket card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.18 }}
              ref={ticketRef}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">

                {/* Ticket header strip */}
                <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-3 flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80">TravelLoop</p>
                    <p className="text-sm font-black leading-tight line-clamp-1">
                      {trip?.title || bookingSummary?.tripTitle}
                    </p>
                  </div>
                  <div className="text-right text-white">
                    <p className="text-[9px] opacity-80 uppercase tracking-wide">Seat</p>
                    <p className="text-2xl font-black">{active.seatNumber}</p>
                  </div>
                </div>

                {/* Ticket body */}
                <div className="px-4 py-4 space-y-3">

                  {/* Passenger info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0 ${
                      active.gender === "Female" ? "bg-pink-400" : "bg-sky-400"
                    }`}>
                      {active.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{active.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {active.gender} · {active.age} years
                        {active.phone && ` · ${active.phone}`}
                      </p>
                    </div>
                  </div>

                  {/* Dashed divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                    <Bus size={12} className="text-slate-300 dark:text-slate-600" />
                    <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                  </div>

                  {/* Trip details */}
                  <div className="grid grid-cols-2 gap-3">
                    {bookingSummary?.startDate && (
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide flex items-center gap-1 mb-0.5">
                          <Calendar size={8} /> Date
                        </p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">{formattedDate}</p>
                      </div>
                    )}
                    {bookingSummary?.pickupLocation && (
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide flex items-center gap-1 mb-0.5">
                          <MapPin size={8} /> Pickup
                        </p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1">
                          {bookingSummary.pickupLocation}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide flex items-center gap-1 mb-0.5">
                        <User size={8} /> Seat Pref
                      </p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {active.seatPreference || "No Preference"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide mb-0.5">Booking ID</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {bookingSummary?.bookingId}
                      </p>
                    </div>
                  </div>

                  {/* Dashed divider with punch circles */}
                  <div className="relative flex items-center">
                    <div className="absolute -left-6 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
                    <div className="flex-1 border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-2" />
                    <div className="absolute -right-6 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
                  </div>

                  {/* QR Code section */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wide">Scan at Boarding</p>
                    <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-inner">
                      <QRCodeCanvas
                        id={`qr-canvas-${activeIdx}`}
                        value={qrString}
                        size={140}
                        level="H"
                        includeMargin
                        fgColor="#0f172a"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium text-center max-w-[180px] leading-relaxed">
                      Show this QR to the driver for boarding verification
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Passenger list summary */}
          {total > 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">All Passengers</p>
              <div className="space-y-1.5">
                {passengers.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${
                      p.gender === "Female" ? "bg-pink-400" : "bg-sky-400"
                    }`}>
                      {p.name?.[0]?.toUpperCase()}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex-1 truncate">{p.name}</span>
                    <span className="text-slate-400">{p.age}y</span>
                    <span className="px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg font-black text-[10px]">
                      {p.seatNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-6 pt-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={downloadQR}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 font-black text-[11px] hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors active:scale-98"
            >
              <Download size={12} />
              Download QR
            </button>
            <button
              onClick={downloadPDF}
              disabled={downloadingPdf}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black text-[11px] shadow-lg shadow-teal-500/30 active:scale-98 disabled:opacity-60"
            >
              <FileText size={12} />
              {downloadingPdf ? "Generating…" : "Download PDF"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TicketModal;
