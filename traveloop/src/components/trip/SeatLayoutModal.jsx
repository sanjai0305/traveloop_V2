/**
 * SeatLayoutModal.jsx — Premium RedBus/MakeMyTrip Bus Seat Selection Experience
 *
 * - Renders driver cabin, entry door, premium sleeper/seater grid layout
 * - Interactive seat nodes with hover animations, glow effects, initials, and tooltips
 * - Premium right-side passenger details drawer (Rounded 28px, Glassmorphism, Fare Summary)
 * - Added: Email Address field, removed Seat Berth Preference select field
 * - Auto-assigned selected seat display
 * - Integrated 6-digit Mobile and Email OTP Verification Flow before proceeding to payment
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Users, Bus, DoorOpen, Check, AlertTriangle, Loader2,
  User, RefreshCw, Info, ArrowRight, Sparkles, Phone, ShieldCheck, Heart, Zap
} from "lucide-react";
import { io as socketIO } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "../../utils/api";
import { useToast } from "../mobile/MobileToast";
import { useAuth } from "../../context/AuthContext";

// ─── SEAT STATUS COLOURS & STYLES ───────────────────────────────────────────

const SEAT_STYLES = {
  available: {
    bg: "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/15 dark:border-emerald-500/20",
    text: "text-emerald-500 dark:text-emerald-400",
    hover: "hover:border-emerald-400 cursor-pointer",
    label: "Available",
  },
  selected: {
    bg: "bg-teal-500 border-teal-600 text-white shadow-lg shadow-teal-500/25",
    text: "text-white",
    hover: "cursor-pointer",
    label: "Selected",
  },
  reserved: {
    bg: "bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/15 dark:border-amber-500/20",
    text: "text-amber-500 dark:text-amber-400",
    hover: "cursor-not-allowed",
    label: "Reserved",
  },
  booked_male: {
    bg: "bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/15 dark:border-rose-500/20",
    text: "text-rose-500 dark:text-rose-450",
    hover: "cursor-not-allowed",
    label: "Occupied",
  },
  booked_female: {
    bg: "bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/15 dark:border-rose-500/20",
    text: "text-rose-500 dark:text-rose-450",
    hover: "cursor-not-allowed",
    label: "Occupied (Female)",
  },
  locked: {
    bg: "bg-slate-500/10 border-slate-500/30 dark:bg-slate-900/40 dark:border-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    hover: "cursor-not-allowed",
    label: "Locked",
  },
};

const getSeatStyle = (seat, isSelected) => {
  if (isSelected) return SEAT_STYLES.selected;
  if (seat.status === "reserved") return SEAT_STYLES.reserved;
  if (seat.status === "locked") return SEAT_STYLES.locked;
  if (seat.status === "booked") {
    return seat.gender === "Female" ? SEAT_STYLES.booked_female : SEAT_STYLES.booked_male;
  }
  return SEAT_STYLES.available;
};

// ─── INDIVIDUAL SEAT CELL ─────────────────────────────────────────────────────

const SeatCell = ({ seat, isSelected, onClick, disabled, passengerInfo }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const style = getSeatStyle(seat, isSelected);
  const isBooked = seat.status === "booked";
  const isReserved = seat.status === "reserved";
  
  const initials = passengerInfo?.name
    ? passengerInfo.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "";

  return (
    <div className="relative flex flex-col items-center">
      <motion.button
        type="button"
        whileHover={{ scale: (isBooked || isReserved || disabled) ? 1 : 1.06 }}
        whileTap={{ scale: (isBooked || isReserved || disabled) ? 1 : 0.95 }}
        onClick={() => !disabled && onClick(seat)}
        onMouseEnter={() => (isBooked || passengerInfo) && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={disabled || isBooked || isReserved}
        className={`
          relative w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center
          text-[9px] font-extrabold transition-all duration-200 select-none
          ${style.bg} ${style.text} ${style.hover}
          ${isSelected ? "ring-2 ring-teal-300 dark:ring-teal-800 scale-105" : ""}
          ${isBooked || isReserved ? "opacity-90" : ""}
        `}
      >
        {isSelected ? (
          <div className="flex flex-col items-center justify-center">
            <span className="leading-none text-[8px] opacity-75">{seat.seatNumber}</span>
            <span className="text-[10px] font-black tracking-tighter mt-0.5 bg-white/20 px-1 rounded">
              {initials || "Sel"}
            </span>
          </div>
        ) : isBooked ? (
          <div className="flex flex-col items-center justify-center opacity-75">
            <User size={10} className="mb-px" />
            <span className="leading-none text-[8px]">{seat.seatNumber}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-2.5 rounded bg-slate-300 dark:bg-slate-700 opacity-40 mb-1" />
            <span className="leading-none">{seat.seatNumber}</span>
          </div>
        )}
        
        {isReserved && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
        )}
      </motion.button>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {showTooltip && (isBooked || passengerInfo) && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none"
          >
            <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl px-3.5 py-2 text-[10px] shadow-2xl border border-slate-700/80 whitespace-nowrap min-w-[140px]">
              <div className="font-black text-[11px] text-teal-400 mb-1">
                Seat {seat.seatNumber} ({passengerInfo ? "Selected" : "Booked"})
              </div>
              <div className="space-y-0.5 opacity-90">
                {passengerInfo ? (
                  <>
                    <div>👤 {passengerInfo.name}</div>
                    <div>🎂 {passengerInfo.age} yrs · {passengerInfo.gender}</div>
                    {passengerInfo.email && <div>✉️ {passengerInfo.email}</div>}
                    {passengerInfo.phone && <div>📞 {passengerInfo.phone}</div>}
                  </>
                ) : (
                  <>
                    {seat.passengerName && <div>👤 {seat.passengerName}</div>}
                    {seat.gender && <div>⚧ {seat.gender}</div>}
                    {seat.age > 0 && <div>🎂 {seat.age} years</div>}
                  </>
                )}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
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
  onConfirm,           // (selectedSeats: string[], passengerList: Passenger[]) => void
  onClose,
}) => {
  const toast = useToast();
  const { user } = useAuth();
  const [seats, setSeats] = useState([]);
  const [counters, setCounters] = useState({ available: 0, male: 0, female: 0, reserved: 0 });
  const [layout, setLayout] = useState({ rows: [], seatsPerRow: 4 });
  const [selected, setSelected] = useState([]);
  
  // Passenger assignments indexed by seat number
  const [passengerDetails, setPassengerDetails] = useState({});
  
  // Active seat drawer state
  const [drawerSeat, setDrawerSeat] = useState(null);
  
  // Drawer form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    bookingForOthers: false,
    travelerPhone: "",
    travelerPhoneVerified: false,
    verifiedAt: null,
  });

  const [drawerOtpSending, setDrawerOtpSending] = useState(false);
  const [drawerOtpSent, setDrawerOtpSent] = useState(false);
  const [drawerOtpCode, setDrawerOtpCode] = useState("");
  const [drawerOtpVerifying, setDrawerOtpVerifying] = useState(false);
  const [drawerConfirmationResult, setDrawerConfirmationResult] = useState(null);
  const [drawerOtpTimer, setDrawerOtpTimer] = useState(0);
  const drawerOtpTimerRef = useRef(null);

  const startDrawerOtpTimer = () => {
    if (drawerOtpTimerRef.current) clearInterval(drawerOtpTimerRef.current);
    setDrawerOtpTimer(60);
    drawerOtpTimerRef.current = setInterval(() => {
      setDrawerOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(drawerOtpTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendDrawerOtp = async (phone) => {
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6-9");
      return;
    }
    setDrawerOtpSending(true);
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      const { auth } = await import("../../services/firebase");

      if (!window.drawerRecaptchaVerifier) {
        window.drawerRecaptchaVerifier = new RecaptchaVerifier(auth, "passenger-recaptcha-container", {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA solved");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
          }
        });
      }

      const formattedPhone = `+91${phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.drawerRecaptchaVerifier);
      setDrawerConfirmationResult(confirmationResult);
      setDrawerOtpSent(true);
      startDrawerOtpTimer();
      toast.success("Verification SMS sent successfully!");
    } catch (err) {
      console.error("Firebase SMS send failure:", err);
      toast.error(err.message || "Failed to send verification SMS.");
    } finally {
      setDrawerOtpSending(false);
    }
  };

  const handleVerifyDrawerOtp = async (code, phone) => {
    if (!code || code.length < 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }
    setDrawerOtpVerifying(true);
    try {
      if (!drawerConfirmationResult) {
        throw new Error("No active phone verification session found.");
      }
      const result = await drawerConfirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();

      // If bookingForOthers is FALSE, we verify and sync the account owner's phone to their profile!
      if (!formData.bookingForOthers) {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl("user/verify-phone"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ phone, idToken, isAlternate: false })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Verification sync failed on server.");
        }
        // Update user context
        const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = { ...cachedUser, ...data.user };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        login(mergedUser, token);
      }

      setFormData((prev) => ({
        ...prev,
        travelerPhone: phone,
        travelerPhoneVerified: true,
        verifiedAt: new Date().toISOString(),
      }));
      setDrawerOtpSent(false);
      setDrawerOtpCode("");
      toast.success("Mobile number verified successfully!");
    } catch (err) {
      console.error("OTP verification failure:", err);
      toast.error(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setDrawerOtpVerifying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (drawerOtpTimerRef.current) clearInterval(drawerOtpTimerRef.current);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);

  // OTP Verification Overlay States
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState(["", "", "", "", "", ""]);
  const [emailOtpInput, setEmailOtpInput] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(120); // 2 minutes
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [serverDebugOtps, setServerDebugOtps] = useState(null);

  const otpCountdownRef = useRef(null);

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

    const seatNum = seat.seatNumber;
    
    if (selected.includes(seatNum)) {
      setSelected((prev) => prev.filter((s) => s !== seatNum));
      setPassengerDetails((prev) => {
        const next = { ...prev };
        delete next[seatNum];
        return next;
      });
      if (drawerSeat === seatNum) {
        setDrawerSeat(null);
      }
      return;
    }

    if (selected.length >= requiredSeats) {
      toast.info(`You can select a maximum of ${requiredSeats} seat(s).`);
      return;
    }

    setSelected((prev) => [...prev, seatNum]);
    openPassengerDrawer(seatNum);
  };

  const openPassengerDrawer = (seatNum) => {
    const existing = passengerDetails[seatNum] || {};
    // Prefill first passenger with user profile if empty
    let initialName = existing.name || "";
    let initialAge = existing.age || "";
    let initialGender = existing.gender || "Male";
    if (!initialName && selected.indexOf(seatNum) === 0 && user) {
      initialName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      initialAge = user.age || "";
      initialGender = user.gender || "Male";
    }
    
    const isBookingForOthers = existing.bookingForOthers || false;
    const isPhoneVerified = existing.travelerPhoneVerified !== undefined 
      ? existing.travelerPhoneVerified 
      : (isBookingForOthers ? false : (user?.phoneVerified || user?.primaryVerified || false));

    setFormData({
      name: initialName,
      age: initialAge,
      gender: initialGender,
      bookingForOthers: isBookingForOthers,
      travelerPhone: existing.travelerPhone || (isBookingForOthers ? "" : (user?.phone || user?.phoneNumber || user?.primaryMobile || "")),
      travelerPhoneVerified: isPhoneVerified,
      verifiedAt: existing.verifiedAt || null,
    });
    setDrawerSeat(seatNum);
  };

  // ── Save Passenger Form Details ─────────────────────────────────────────────
  const handleSavePassenger = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      toast.error("Passenger Name must be at least 3 characters");
      return;
    }
    const ageNum = Number(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      toast.error("Passenger Age must be between 1 and 100");
      return;
    }
    if (!formData.gender) {
      toast.error("Gender is required");
      return;
    }

    const isVerified = formData.bookingForOthers
      ? formData.travelerPhoneVerified
      : (user?.phoneVerified || user?.primaryVerified || formData.travelerPhoneVerified);

    if (!isVerified) {
      toast.error("Mobile number verification is mandatory before saving passenger details");
      return;
    }

    // Save details
    setPassengerDetails((prev) => ({
      ...prev,
      [drawerSeat]: {
        seatNumber: drawerSeat,
        name: formData.name.trim(),
        age: ageNum,
        gender: formData.gender,
        bookingForOthers: formData.bookingForOthers,
        travelerPhone: formData.travelerPhone,
        travelerPhoneVerified: formData.travelerPhoneVerified,
        verifiedAt: formData.verifiedAt,
      },
    }));

    setDrawerSeat(null);
    toast.success(`Details for Seat ${drawerSeat} saved!`);
  };

  // ── OTP Delivery & Timer Helpers ──────────────────────────────────────────
  const handleSendOtp = async (passengersList) => {
    setOtpSending(true);
    setOtpError("");
    try {
      const firstPassenger = passengersList[0];
      const email = firstPassenger?.email;
      const phone = firstPassenger?.phone;
      
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("payment/send-booking-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, phone })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(120);
        if (data.debugOtp) {
          setServerDebugOtps(data.debugOtp);
        }
        startOtpTimer();
        toast.success("Verification codes sent successfully!");
      } else {
        setOtpError(data.message || "Failed to send verification codes.");
      }
    } catch (err) {
      setOtpError("Network error sending OTPs.");
    } finally {
      setOtpSending(false);
    }
  };

  const startOtpTimer = () => {
    if (otpCountdownRef.current) clearInterval(otpCountdownRef.current);
    otpCountdownRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(otpCountdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    setOtpVerifying(true);
    setOtpError("");
    
    const emailOtpStr = emailOtpInput.join("");
    const mobileOtpStr = mobileOtpInput.join("");
    
    if (emailOtpStr.length < 6 || mobileOtpStr.length < 6) {
      setOtpError("Please enter all 6 digits for both OTPs.");
      setOtpVerifying(false);
      return;
    }
    
    try {
      const firstPassenger = selected.map((seatNum) => ({
        ...passengerDetails[seatNum]
      }))[0];
      const email = firstPassenger?.email;
      const phone = firstPassenger?.phone;
      
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("payment/verify-booking-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          phone,
          emailOtp: emailOtpStr,
          mobileOtp: mobileOtpStr
        })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSuccess(true);
        setTimeout(() => {
          setShowOtpVerification(false);
          // Proceed to payments trigger on parent callback
          const passengersList = selected.map((seatNum) => ({
            ...passengerDetails[seatNum],
            seatNumber: seatNum,
          }));
          onConfirm(selected, passengersList);
        }, 1500);
      } else {
        setOtpError(data.message || "Invalid OTPs. Please try again.");
      }
    } catch (err) {
      setOtpError("Network error verifying OTPs.");
    } finally {
      setOtpVerifying(false);
    }
  };

  useEffect(() => {
    return () => clearInterval(otpCountdownRef.current);
  }, []);

  // ── Confirm Booking & Seat Reservation ─────────────────────────────────────
  const handleConfirm = async () => {
    const missing = selected.filter((seatNum) => !passengerDetails[seatNum]);
    if (missing.length > 0) {
      toast.error(`Please fill passenger details for seat(s): ${missing.join(", ")}`);
      openPassengerDrawer(missing[0]);
      return;
    }

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
      setPassengerDetails((prev) => {
        const next = { ...prev };
        failedSeats.forEach((fs) => delete next[fs]);
        return next;
      });
      fetchSeats();
      return;
    }

    const passengersList = selected.map((seatNum) => {
      const p = passengerDetails[seatNum] || {};
      return {
        name: p.name,
        passengerName: p.name,
        age: Number(p.age),
        gender: p.gender,
        seatNumber: seatNum,
        contactEmail: user?.email || "",
        contactPhone: user?.phone || user?.phoneNumber || user?.primaryMobile || "",
        emailVerified: true,
        phoneVerified: true,
      };
    });

    onConfirm(selected, passengersList);
  };

  // ── Fare calculations ──────────────────────────────────────────────────────
  const baseFare = trip.offerPrice || trip.pricePerPerson || 2500;
  const numSelected = selected.length;
  const fareSubtotal = baseFare * numSelected;
  const fareTax = Math.round(fareSubtotal * 0.05);
  const fareConvenience = numSelected > 0 ? 150 : 0;
  const fareTotal = fareSubtotal + fareTax + fareConvenience;

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
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-955/80 backdrop-blur-sm" onClick={onClose} />

      {/* Main Seat Dialog Container */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-4xl h-full md:h-[88vh] bg-slate-900 border border-slate-800 text-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        
        {/* OTP Verification Overlay */}
        <AnimatePresence>
          {showOtpVerification && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-955/95 backdrop-blur-md p-6"
            >
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative">
                
                <button
                  type="button"
                  onClick={() => setShowOtpVerification(false)}
                  className="absolute top-4 right-4 text-slate-450 hover:text-white"
                >
                  <X size={18} />
                </button>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto text-teal-400">
                    <ShieldCheck size={22} className="animate-pulse" />
                  </div>
                  <h3 className="text-base font-black text-white">Security Verification</h3>
                  <p className="text-xs text-slate-400">
                    Verify contact details to secure booking transaction.
                  </p>
                </div>

                {otpSuccess ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl">
                      ✓
                    </div>
                    <p className="text-sm font-black text-emerald-400">Verifications Successful!</p>
                    <p className="text-[10px] text-slate-505 text-center">Redirecting to payment gateway...</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* Mobile OTP */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-405 uppercase tracking-widest">
                        Mobile Verification Code
                      </label>
                      <div className="flex gap-2 justify-center">
                        {mobileOtpInput.map((val, idx) => (
                          <input
                            key={`mobile-${idx}`}
                            id={`mobile-input-${idx}`}
                            type="text"
                            maxLength="1"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            value={val}
                            onChange={(e) => {
                              const newOTP = [...mobileOtpInput];
                              newOTP[idx] = e.target.value;
                              setMobileOtpInput(newOTP);
                              if (e.target.value && idx < 5) {
                                document.getElementById(`mobile-input-${idx + 1}`)?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !mobileOtpInput[idx] && idx > 0) {
                                document.getElementById(`mobile-input-${idx - 1}`)?.focus();
                              }
                            }}
                            className="w-10 h-12 rounded-xl border border-slate-800 bg-slate-950 text-center font-bold text-base text-white outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Email OTP */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-405 uppercase tracking-widest">
                        Email Verification Code
                      </label>
                      <div className="flex gap-2 justify-center">
                        {emailOtpInput.map((val, idx) => (
                          <input
                            key={`email-${idx}`}
                            id={`email-input-${idx}`}
                            type="text"
                            maxLength="1"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            value={val}
                            onChange={(e) => {
                              const newOTP = [...emailOtpInput];
                              newOTP[idx] = e.target.value;
                              setEmailOtpInput(newOTP);
                              if (e.target.value && idx < 5) {
                                document.getElementById(`email-input-${idx + 1}`)?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !emailOtpInput[idx] && idx > 0) {
                                document.getElementById(`email-input-${idx - 1}`)?.focus();
                              }
                            }}
                            className="w-10 h-12 rounded-xl border border-slate-800 bg-slate-955 text-center font-bold text-base text-white outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Debug Fill */}
                    {serverDebugOtps && (
                      <div className="p-2 bg-slate-955 border border-slate-800 rounded-xl text-[9px] text-teal-400 font-mono text-center flex items-center justify-center gap-1.5">
                        <span>Fill: SMS: <strong>{serverDebugOtps.mobileOtp}</strong> | Mail: <strong>{serverDebugOtps.emailOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOtpInput(serverDebugOtps.mobileOtp.split(""));
                            setEmailOtpInput(serverDebugOtps.emailOtp.split(""));
                          }}
                          className="px-2 py-0.5 bg-teal-500 text-slate-950 font-black rounded uppercase text-[8px]"
                        >
                          Auto Fill
                        </button>
                      </div>
                    )}

                    {/* Error display */}
                    {otpError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-bold text-center">
                        {otpError}
                      </div>
                    )}

                    {/* Timer & Resend */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">
                        {otpTimer > 0 ? `Resend code in ${otpTimer}s` : "Didn't receive codes?"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const passengersList = selected.map((seatNum) => ({
                            ...passengerDetails[seatNum],
                            seatNumber: seatNum,
                          }));
                          handleSendOtp(passengersList);
                        }}
                        disabled={otpTimer > 0 || otpSending}
                        className="text-teal-400 hover:text-teal-300 font-black disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpSending ? "Sending..." : "Resend OTP"}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpVerifying}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                      >
                        {otpVerifying ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                        Verify & Continue To Payment
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Side: Seat Layout Grid */}
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
          
          {/* Layout Header */}
          <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-black flex items-center gap-2">
                <Bus size={16} className="text-teal-400" />
                Select Seats — {trip.title || "Bus"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Please select exactly {requiredSeats} seat(s) on the bus grid.</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-450 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 flex-1 space-y-6">
            
            {/* Color Legend */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-xl mx-auto bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
              {Object.entries(SEAT_STYLES).map(([key, style]) => (
                <div key={key} className="flex items-center gap-2 text-[10px] font-bold text-slate-350">
                  <div className={`w-3.5 h-3.5 rounded border ${style.bg.split(" ")[0]} ${style.bg.split(" ")[1] || ""}`} />
                  <span>{style.label}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                <span className="text-xs text-slate-405 font-bold">Configuring bus seating matrix...</span>
              </div>
            ) : error ? (
              <div className="max-w-md mx-auto p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs rounded-2xl flex items-start gap-2.5">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              /* Bus Layout */
              <div className="max-w-sm mx-auto bg-slate-955 border border-slate-850 rounded-3xl p-5 shadow-inner relative">
                
                {/* Front Bumper & Driver Cabin */}
                <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-800 mb-5 text-slate-450">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5">
                    <DoorOpen size={12} className="text-teal-400" />
                    Entry Door
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5">
                    <Bus size={12} className="text-slate-400" />
                    Driver Cabin
                  </div>
                </div>

                {/* Rows Grid */}
                <div className="space-y-4">
                  {layout.rows.map((row) => {
                    const rowSeats = seatsByRow[row] || [];
                    const leftSeats = rowSeats.filter((s) => s.col <= 2);
                    const rightSeats = rowSeats.filter((s) => s.col > 2);
                    return (
                      <div key={row} className="flex items-center gap-2.5">
                        <span className="w-4 text-[10px] font-black text-slate-500 text-center">{row}</span>

                        <div className="flex gap-2">
                          {leftSeats.map((seat) => (
                            <SeatCell
                              key={seat.seatNumber}
                              seat={seat}
                              isSelected={selected.includes(seat.seatNumber)}
                              onClick={handleSeatClick}
                              disabled={reserving}
                              passengerInfo={passengerDetails[seat.seatNumber]}
                            />
                          ))}
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                          <div className="w-full border-t border-dashed border-slate-800 my-auto h-px" />
                        </div>

                        <div className="flex gap-2">
                          {rightSeats.map((seat) => (
                            <SeatCell
                              key={seat.seatNumber}
                              seat={seat}
                              isSelected={selected.includes(seat.seatNumber)}
                              onClick={handleSeatClick}
                              disabled={reserving}
                              passengerInfo={passengerDetails[seat.seatNumber]}
                            />
                          ))}
                        </div>

                        <span className="text-[8px] font-black text-slate-605 uppercase w-3.5">
                          {row <= "E" ? "Lwr" : "Upr"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Back Rear bumper */}
                <div className="mt-5 pt-3.5 border-t border-dashed border-slate-800 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[8px] font-black text-slate-605 uppercase tracking-widest">
                    <div className="h-px w-6 bg-slate-800" />
                    Rear End
                    <div className="h-px w-6 bg-slate-800" />
                  </div>
                </div>
              </div>
            )}

            {/* Refresh Strip */}
            <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
              <button
                type="button"
                onClick={fetchSeats}
                disabled={loading}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold mx-auto hover:text-teal-400 transition-colors"
              >
                <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                Live Seat Status Refresh
              </button>

              <div className="flex items-start gap-2.5 p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-normal">
                  Seats are locked for <span className="text-teal-400 font-bold">10 minutes</span> upon selection to allow form completion and payment.
                </p>
              </div>
            </div>
          </div>

          {/* Left panel footer */}
          <div className="sticky bottom-0 bg-slate-900 border-t border-slate-850 px-6 py-4 space-y-4 shrink-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Selection Progress ({selected.length} / {requiredSeats})
                </span>
                {selected.length > 0 && (
                  <span className="text-[11px] text-teal-400 font-black">
                    Seats: {selected.join(", ")}
                  </span>
                )}
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", damping: 20 }}
                />
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={selected.length !== requiredSeats || reserving}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                selected.length === requiredSeats && !reserving
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20 active:scale-98"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              }`}
            >
              {reserving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Locking Bus Seats...
                </>
              ) : (
                <>
                  <Check size={13} />
                  Confirm Selection & Proceed (₹{new Intl.NumberFormat('en-IN').format(fareTotal)})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Slide-over Drawer for Passenger Assignment */}
        <AnimatePresence>
          {drawerSeat && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute md:relative top-0 right-0 h-full w-full md:w-[380px] bg-slate-950 md:bg-slate-950 border-l border-slate-850 z-30 flex flex-col backdrop-blur-xl rounded-l-[28px]"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-850 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2 text-white">
                    <Sparkles size={14} className="text-teal-400 animate-pulse" />
                    Passenger Assignment
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please provide passenger details for verification.</p>
                </div>
                <button
                  onClick={() => setDrawerSeat(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Drawer Body */}
              <form onSubmit={handleSavePassenger} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Seat Assigned Badge */}
                <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-400" />
                    <span className="text-xs font-black text-slate-200">Seat Allocation</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-teal-500 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(20,184,166,0.4)]">
                    Seat {drawerSeat} Assigned
                  </span>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Passenger Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter Full Name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-white outline-none focus:border-teal-400 focus:shadow-[0_0_12px_rgba(20,184,166,0.15)] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Age</label>
                      <input
                        type="number"
                        required
                        min="5"
                        max="120"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Years"
                        className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-900 text-xs font-bold text-white outline-none focus:border-teal-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-900 text-xs font-bold text-white outline-none focus:border-teal-400 transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Booking For Someone Else Toggle */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-200">Booking For Someone Else</span>
                    <span className="text-[9px] text-slate-400">Specify if someone else is travelling</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = !formData.bookingForOthers;
                      setFormData(prev => ({
                        ...prev,
                        bookingForOthers: newVal,
                        travelerPhone: newVal ? "" : (user?.phone || user?.phoneNumber || user?.primaryMobile || ""),
                        travelerPhoneVerified: newVal ? false : (user?.phoneVerified || user?.primaryVerified || false),
                      }));
                      setDrawerOtpSent(false);
                      setDrawerOtpCode("");
                    }}
                    className="relative w-10 h-6 rounded-full transition-colors shrink-0"
                    style={{ background: formData.bookingForOthers ? "#14B8B5" : "#E2E8F0" }}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                      style={{ left: formData.bookingForOthers ? "18px" : "2px" }}
                    />
                  </button>
                </div>

                {/* Contact Verification Cards */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-1 flex items-center gap-1.5">
                    📞 Traveler Contact Details
                  </p>

                  {!formData.bookingForOthers ? (
                    /* Booking for Self */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Email Address</label>
                        <div className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-500 select-none flex justify-between items-center">
                          <span>{user?.email || "No email available"}</span>
                          <span className="text-[9px] font-black text-teal-400 tracking-wider">✓ Verified</span>
                        </div>
                      </div>

                      {user?.phoneVerified || user?.primaryVerified ? (
                        /* Scenario 2: Returning traveler (Verified) */
                        <div>
                          <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Mobile Number</label>
                          <div className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-500 select-none flex justify-between items-center">
                            <span>{user?.phone || user?.phoneNumber || user?.primaryMobile}</span>
                            <span className="text-[9px] font-black text-teal-400 tracking-wider">✓ Verified</span>
                          </div>
                        </div>
                      ) : (
                        /* Scenario 1: First-time traveler (Unverified) */
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Mobile Number</label>
                            <input
                              type="tel"
                              value={formData.travelerPhone}
                              onChange={(e) => setFormData({ ...formData, travelerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                              placeholder="Enter 10-digit number"
                              disabled={formData.travelerPhoneVerified}
                              className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-950 text-xs font-bold text-white outline-none focus:border-teal-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          {formData.travelerPhoneVerified ? (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold flex items-center justify-between">
                              <span>✓ Mobile Verified</span>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {!drawerOtpSent ? (
                                <button
                                  type="button"
                                  onClick={() => handleSendDrawerOtp(formData.travelerPhone)}
                                  disabled={drawerOtpSending || formData.travelerPhone.length !== 10}
                                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50"
                                >
                                  {drawerOtpSending ? "Sending OTP..." : "Verify Mobile Number"}
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    maxLength="6"
                                    value={drawerOtpCode}
                                    onChange={(e) => setDrawerOtpCode(e.target.value.replace(/\D/g, ""))}
                                    placeholder="Enter 6-digit OTP"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-955 text-center font-bold text-xs text-white outline-none focus:border-teal-400"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyDrawerOtp(drawerOtpCode, formData.travelerPhone)}
                                      disabled={drawerOtpVerifying || drawerOtpCode.length !== 6}
                                      className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
                                    >
                                      {drawerOtpVerifying ? "Verifying..." : "Verify OTP"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDrawerOtpSent(false)}
                                      className="px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Booking for Others */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Passenger Mobile Number</label>
                        <input
                          type="tel"
                          value={formData.travelerPhone}
                          onChange={(e) => setFormData({ ...formData, travelerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                          placeholder="Enter Passenger Mobile"
                          disabled={formData.travelerPhoneVerified}
                          className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-950 text-xs font-bold text-white outline-none focus:border-teal-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      {formData.travelerPhoneVerified ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold flex items-center justify-between">
                          <span>✓ Verified</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {!drawerOtpSent ? (
                            <button
                              type="button"
                              onClick={() => handleSendDrawerOtp(formData.travelerPhone)}
                              disabled={drawerOtpSending || formData.travelerPhone.length !== 10}
                              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50"
                            >
                              {drawerOtpSending ? "Sending OTP..." : "Send OTP"}
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                maxLength="6"
                                value={drawerOtpCode}
                                onChange={(e) => setDrawerOtpCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="Enter 6-digit OTP"
                                className="w-full px-4 py-3 rounded-xl border border-slate-805 bg-slate-955 text-center font-bold text-xs text-white outline-none focus:border-teal-400"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleVerifyDrawerOtp(drawerOtpCode, formData.travelerPhone)}
                                  disabled={drawerOtpVerifying || drawerOtpCode.length !== 6}
                                  className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
                                >
                                  {drawerOtpVerifying ? "Verifying..." : "Verify OTP"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDrawerOtpSent(false)}
                                  className="px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div id="passenger-recaptcha-container" className="hidden" />

                {/* Fare Summary Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-2.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-1 flex items-center gap-1.5">
                    💳 Fare Breakdown (INR)
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 font-semibold">
                    <div className="flex justify-between">
                      <span>Base Ticket price:</span>
                      <span className="font-extrabold text-white">₹{new Intl.NumberFormat('en-IN').format(baseFare)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST & State taxes (5%):</span>
                      <span className="font-extrabold text-white">₹{new Intl.NumberFormat('en-IN').format(Math.round(baseFare * 0.05))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Booking Convenience fee:</span>
                      <span className="font-extrabold text-white">₹150</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-800 mt-2 text-xs font-black">
                    <span className="text-white">Total Amount:</span>
                    <span className="text-teal-400 text-sm">₹{new Intl.NumberFormat('en-IN').format(baseFare + Math.round(baseFare * 0.05) + 150)}</span>
                  </div>
                </div>

                {/* Drawer Footer CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={14} />
                    Save Passenger Details
                  </button>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};

export default SeatLayoutModal;
