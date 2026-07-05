// src/pages/BookedPackageDetail.jsx — Complete Travel Guide for Booked Packages

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, CalendarDays, Clock, Users, Phone,
  Hotel, Bus, Utensils, ShoppingBag, DollarSign, Compass,
  StickyNote, CheckCircle, XCircle, Star, ChevronDown, ChevronUp,
  Wifi, Wind, Zap, Bed, Shield, AlertCircle, Package, Save,
  CheckSquare, Square, Check, QrCode,
  BookOpen, CloudSun, Wallet, PlusCircle, Trash2, ListChecks,
  Thermometer, Droplets, Eye, RefreshCw,
  MessageCircle, Truck, UserCheck, BadgeCheck, Bell, Send,
  AlertTriangle, Info, Navigation, Sparkles,
} from "lucide-react";
import { subscribeToMessages, sendMessage, markSeen, bootstrapTripMembers } from "../services/chatService";
import { auth } from "../services/firebase";
import { signInAnonymously } from "firebase/auth";
import { useToast } from "../components/mobile/MobileToast";
import { loadRazorpay } from "../utils/loadRazorpay";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";
import { QRCodeSVG } from "qrcode.react";
import { socket } from "../utils/socket";

// ─── HELPERS ──────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Parse itinerary description to extract time segments
const parseDescription = (desc = "") => {
  const segments = [];
  const lines = desc.split("\n").filter(Boolean);
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("🌅") || trimmed.toLowerCase().startsWith("morning:")) {
      current = { time: "🌅 Morning", text: trimmed.replace(/^🌅\s*(Morning:?\s*)?/i, "").replace(/^Morning:\s*/i, "") };
      segments.push(current);
    } else if (trimmed.startsWith("🍽️") || trimmed.startsWith("🍴") || trimmed.toLowerCase().startsWith("lunch:")) {
      current = { time: "🍽️ Lunch", text: trimmed.replace(/^🍽️\s*(Lunch:?\s*)?/i, "").replace(/^Lunch:\s*/i, "") };
      segments.push(current);
    } else if (trimmed.startsWith("🌇") || trimmed.toLowerCase().startsWith("evening:") || trimmed.toLowerCase().startsWith("afternoon:")) {
      current = { time: "🌇 Evening", text: trimmed.replace(/^🌇\s*(Evening:?\s*|Afternoon:?\s*)?/i, "").replace(/^(Evening|Afternoon):\s*/i, "") };
      segments.push(current);
    } else if (trimmed.startsWith("🌙") || trimmed.toLowerCase().startsWith("night:")) {
      current = { time: "🌙 Night", text: trimmed.replace(/^🌙\s*(Night:?\s*)?/i, "").replace(/^Night:\s*/i, "") };
      segments.push(current);
    } else if (trimmed.startsWith("📝") || trimmed.toLowerCase().startsWith("note:") || trimmed.toLowerCase().startsWith("notes:")) {
      current = { time: "📝 Note", text: trimmed.replace(/^📝\s*(Notes?:?\s*)?/i, "").replace(/^Notes?:\s*/i, "") };
      segments.push(current);
    } else if (current) {
      current.text += " " + trimmed;
    } else {
      segments.push({ time: "", text: trimmed });
    }
  }
  return segments;
};

// Generate smart packing list from destination + category
const generatePackingList = (trip) => {
  const dest      = ((trip.destinations || [])[0] || "").toLowerCase();
  const category  = (trip.category || "").toLowerCase();
  const days      = trip.duration ? parseInt(trip.duration) : 3;

  const base = [
    { item: "Valid ID / Aadhaar card",        cat: "Documents", packed: false },
    { item: "Booking confirmation",           cat: "Documents", packed: false },
    { item: "Travel insurance copy",          cat: "Documents", packed: false },
    { item: "Emergency contact list",         cat: "Documents", packed: false },
    { item: "Comfortable walking shoes",      cat: "Clothing",  packed: false },
    { item: "Casual t-shirts (3–4)",          cat: "Clothing",  packed: false },
    { item: "Sunscreen SPF 50+",              cat: "Essentials",packed: false },
    { item: "Reusable water bottle",          cat: "Essentials",packed: false },
    { item: "Personal medications",           cat: "Health",    packed: false },
    { item: "Hand sanitizer & mask",          cat: "Health",    packed: false },
    { item: "Power bank",                     cat: "Gadgets",   packed: false },
    { item: "Phone charger & cables",         cat: "Gadgets",   packed: false },
    { item: "Camera / GoPro",                 cat: "Gadgets",   packed: false },
  ];

  // Beach/coastal
  if (dest.includes("goa") || dest.includes("bali") || dest.includes("maldives") || dest.includes("beach") || dest.includes("coastal")) {
    base.push(
      { item: "Swimwear (2 sets)",              cat: "Clothing",  packed: false },
      { item: "Flip-flops / sandals",           cat: "Clothing",  packed: false },
      { item: "Beach towel",                    cat: "Essentials",packed: false },
      { item: "Waterproof phone pouch",         cat: "Gadgets",   packed: false },
      { item: "After-sun lotion",               cat: "Health",    packed: false }
    );
  }

  // Mountains / cold
  if (dest.includes("manali") || dest.includes("ladakh") || dest.includes("shimla") || dest.includes("switzerland") || category.includes("adventure")) {
    base.push(
      { item: "Warm jacket / puffer",           cat: "Clothing",  packed: false },
      { item: "Thermal inner wear",             cat: "Clothing",  packed: false },
      { item: "Woolen socks & gloves",          cat: "Clothing",  packed: false },
      { item: "Trekking shoes",                 cat: "Clothing",  packed: false },
      { item: "Lip balm & moisturizer",         cat: "Health",    packed: false },
      { item: "First-aid kit",                  cat: "Health",    packed: false }
    );
  }

  // Luxury / Honeymoon
  if (category.includes("luxury") || category.includes("honeymoon")) {
    base.push(
      { item: "Formal / evening wear",          cat: "Clothing",  packed: false },
      { item: "Perfume / cologne",              cat: "Essentials",packed: false },
      { item: "Dress shoes",                    cat: "Clothing",  packed: false }
    );
  }

  // Pilgrimage
  if (category.includes("pilgrim")) {
    base.push(
      { item: "Traditional / modest clothing",  cat: "Clothing",  packed: false },
      { item: "Comfortable sandals",            cat: "Clothing",  packed: false }
    );
  }

  // Long trips (7+ days)
  if (days >= 7) {
    base.push(
      { item: "Laundry bag",                    cat: "Essentials",packed: false },
      { item: "Travel-size detergent",          cat: "Essentials",packed: false }
    );
  }

  return base;
};

// Module tab definitions
const MODULE_TABS = [
  { key: "itinerary",      label: "Itinerary",     icon: CalendarDays },
  { key: "members",        label: "Members",        icon: Users },
  { key: "group-chat",     label: "Group Chat",     icon: MessageCircle },
  { key: "driver-updates", label: "Driver Updates", icon: Truck },
  { key: "hotel",          label: "Hotel",          icon: Hotel },
  { key: "transport",      label: "Transport",      icon: Bus },
  { key: "meals",          label: "Meals",          icon: Utensils },
  { key: "packing",        label: "Packing",        icon: ShoppingBag },
  { key: "budget",         label: "Budget",         icon: DollarSign },
  { key: "activities",     label: "Activities",     icon: Compass },
  { key: "notes",          label: "Notes",          icon: StickyNote },
  { key: "weather",        label: "Weather",        icon: CloudSun },
  { key: "journal",        label: "Journal",        icon: BookOpen },
  { key: "expenses",       label: "Expenses",       icon: Wallet },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────
const BookedPackageDetail = () => {
  const { bookingId } = useParams();
  const { user, firebaseUser, isInitialized } = useAuth();
  const location      = useLocation();
  const navigate      = useNavigate();

  const [booking,      setBooking]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState(location.state?.tab || "itinerary");
  const [expandedDay,  setExpandedDay]  = useState(0);
  const [packingList,  setPackingList]  = useState([]);
  const [notes,        setNotes]        = useState("");
  const [notesSaving,  setNotesSaving]  = useState(false);
  const [notesSaved,   setNotesSaved]   = useState(false);
  const tabRef = useRef(null);

  // QR & Boarding state
  const [qrToken,      setQrToken]      = useState(null);
  const [qrImage,      setQrImage]      = useState(null);
  const [showQrModal,  setShowQrModal]  = useState(false);
  const [qrError,      setQrError]      = useState("");
  const [qrLoading,    setQrLoading]    = useState(false);
  const [boardingPass, setBoardingPass] = useState(null);
  const [agency,       setAgency]       = useState(null);
  const [timeLeft,     setTimeLeft]     = useState("");

  // Personal trip planner link
  const [userTripId,   setUserTripId]   = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── NEW: Members tab state ─────────────────────────────────
  const [members,       setMembers]       = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberDriver,  setMemberDriver]  = useState(null);

  // ── NEW: Group Chat tab state ──────────────────────────────
  const [chatMessages,   setChatMessages]   = useState([]);
  const [chatInput,      setChatInput]      = useState("");
  const [chatSending,    setChatSending]    = useState(false);
  const [chatLoading,    setChatLoading]    = useState(false);
  const chatEndRef = useRef(null);

  // ── NEW: Driver Updates tab state ─────────────────────────
  const [driverUpdates,    setDriverUpdates]    = useState([]);
  const [driverUpdLoading, setDriverUpdLoading] = useState(false);

  // Weather state
  const [weather,      setWeather]      = useState(null);
  const [weatherLoad,  setWeatherLoad]  = useState(false);

  // Journal state
  const [journalText,  setJournalText]  = useState("");
  const [journalMood,  setJournalMood]  = useState("");
  const [journalSaved, setJournalSaved] = useState(false);

  // Expenses state
  const [expenses,      setExpenses]     = useState([]);
  const [expenseForm,   setExpenseForm]  = useState({ label: "", amount: "", category: "Food" });

  // Add Passenger Flow states
  const [showAddPassengerModal, setShowAddPassengerModal] = useState(false);
  const [newPassenger, setNewPassenger] = useState({ name: "", age: "", gender: "Male", seat: "", phone: "", emergencyContact: "" });
  const [addPassengerLoading, setAddPassengerLoading] = useState(false);

  const trip = booking?.agentTrip || booking?.tripId || {};

  const allowCancellation = trip.allowCancellation !== false;
  const deadlineStr = trip.cancellationUntilDate ? `${trip.cancellationUntilDate}T${trip.cancellationUntilTime || "18:00"}:00` : null;
  const deadline = deadlineStr ? new Date(deadlineStr) : null;
  const isCancellationExpired = deadline ? new Date() > deadline : false;
  const isBookingCancelled = booking?.status === "cancelled" || booking?.paymentStatus === "Cancelled";

  // Live countdown timer for boarding window
  useEffect(() => {
    if (!trip || !trip.startDate) return;
    
    const calculateCountdown = () => {
      const now = new Date();
      const tripStartDateStr = trip.startDate;
      const departureTimeStr = trip.departureTime || "00:00";
      const departureDateTime = new Date(`${tripStartDateStr}T${departureTimeStr}:00`);
      const boardingStart = new Date(departureDateTime.getTime() - 60 * 60 * 1000);
      
      const diffMs = boardingStart.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft("");
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        
        if (hours > 0) {
          setTimeLeft(`Available in ${hours}h ${mins}m`);
        } else {
          setTimeLeft(`Available in ${mins}m`);
        }
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 30000); // update every 30s is enough
    
    return () => clearInterval(interval);
  }, [trip]);

  const getBoardingButtonState = () => {
    if (!booking || !trip) return { label: "Not Available", disabled: true, statusClass: "locked" };

    if (booking.boardingStatus === "boarded" || booking.boardingStatus === "Boarded") {
      return { label: "Successfully Checked In", disabled: true, statusClass: "checked-in" };
    }

    if (booking.status === "cancelled" || booking.paymentStatus === "Cancelled" || booking.status === "Cancelled") {
      return { label: "Booking Cancelled", disabled: true, statusClass: "cancelled" };
    }

    if (trip.status === "completed" || trip.publishStatus === "completed" || trip.boardingStatus === "COMPLETED") {
      return { label: "Boarding Closed", disabled: true, statusClass: "closed" };
    }

    const today = new Date().toISOString().split("T")[0];
    const isBeforeTravelDay = today < trip.startDate;

    if (!trip.driver || trip.status === "cancelled" || trip.status === "Cancelled" || isBeforeTravelDay) {
      return { label: "Not Available", disabled: true, statusClass: "locked" };
    }

    if (trip.boardingStatus === "CLOSED") {
      return { label: "Boarding Closed", disabled: true, statusClass: "closed" };
    }

    if (trip.boardingStatus === "OPEN") {
      if (qrToken || booking.token) {
        return { label: "QR Active", disabled: false, statusClass: "qr-ready" };
      }
      return { label: "Generate Boarding Pass", disabled: false, statusClass: "open" };
    }

    const departureTimeStr = trip.departureTime || "00:00";
    const departureDateTime = new Date(`${trip.startDate}T${departureTimeStr}:00`);
    const boardingStart = new Date(departureDateTime.getTime() - 60 * 60 * 1000);
    const now = new Date();

    if (now < boardingStart) {
      const diffMs = boardingStart.getTime() - now.getTime();
      const mins = Math.ceil(diffMs / 60000);
      if (mins <= 60) {
        return { label: `Boarding opens in ${mins} minutes`, disabled: true, statusClass: "countdown" };
      }
    }

    return { label: "Not Available", disabled: true, statusClass: "locked" };
  };

  const handleGenerateQr = async () => {
    setQrError("");
    setQrLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        bookingId: booking._id,
        tripId: trip._id,
        userId: booking.userId?._id || booking.userId,
        seatNumber: booking.assignedSeat || booking.seatNumbers?.[0] || "Waiting For Driver Assignment",
        travelDate: trip.startDate,
        pickupPoint: booking.pickupLocation || trip.pickupLocation || ""
      };

      const res = await fetch(getApiUrl("boarding/generate-qr"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setQrToken(data.token);
        setQrImage(data.qrImage);
        
        // Update booking state
        setBooking(prev => ({
          ...prev,
          boardingPass: data.boardingId,
          qrCode: data.qrImage,
          token: data.token,
          generatedAt: new Date(),
          expiresAt: data.expiresAt,
        }));
        
        setShowQrModal(true);
      } else {
        setQrError(data.message || "Failed to generate QR");
      }
    } catch (err) {
      setQrError("Error generating QR code");
    } finally {
      setQrLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking? This action is irreversible and will release your seats.")) {
      return;
    }
    setCancelLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`bookings/${bookingId}/cancel`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: "Cancelled by traveler" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Booking cancelled successfully.");
        fetchBooking();
      } else {
        alert(data.message || "Failed to cancel booking");
      }
    } catch (err) {
      alert("Error cancelling booking");
    } finally {
      setCancelLoading(false);
    }
  };

  const toast = useToast();

  const handleAddPassengerPayment = async (e) => {
    e.preventDefault();
    if (!newPassenger.name || !newPassenger.age || !newPassenger.gender) {
      toast.error("Please fill in name, age, and gender.");
      return;
    }

    setAddPassengerLoading(true);
    try {
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        toast.error("Razorpay SDK failed to load. Are you offline?");
        setAddPassengerLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const price = trip.offerPrice || trip.pricePerPerson || 0;
      const additionalAmount = price;

      // 1. Create Order for additional amount
      const orderRes = await fetch(getApiUrl("payment/create-order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: trip._id,
          seats: 1
        })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        toast.error(orderData.message || "Failed to initiate payment");
        setAddPassengerLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout Dialog
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
        amount: orderData.amount * 100, // paise
        currency: orderData.currency || "INR",
        name: "Traveloop - Add Passenger",
        description: `Add passenger to ${trip.title}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify and update the existing booking document
            const verifyRes = await fetch(getApiUrl("payment/verify"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking._id,
                additionalPassengers: [newPassenger],
                additionalAmount
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("Passenger successfully added!");
              setShowAddPassengerModal(false);
              setNewPassenger({ name: "", age: "", gender: "Male", seat: "", phone: "", emergencyContact: "" });
              fetchBooking();
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            toast.error("Verification error. Please contact support.");
          }
        },
        prefill: {
          name: newPassenger.name,
          contact: newPassenger.phone,
        },
        theme: {
          color: "#14B8A6"
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Checkout failed. Try again.");
    } finally {
      setAddPassengerLoading(false);
    }
  };

  // Fetch booking
  const fetchBooking = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`bookings/${bookingId}/user-trip`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBooking(data.booking);
        setBoardingPass(data.boardingPass);
        setAgency(data.agency || data.booking.agent);
        setNotes(data.booking.personalNotes || "");
        
        if (data.booking.qrCode) {
          setQrImage(data.booking.qrCode);
        }
        if (data.booking.token) {
          setQrToken(data.booking.token);
        }
        
        if (data.userTrip) {
          setUserTripId(data.userTrip._id || data.userTrip);
        }
      } else {
        alert(data.message || "Booking not found");
        navigate("/my-trips");
      }
    } catch (err) {
      console.error("Error fetching booking details:", err);
      alert("Error fetching booking details");
      navigate("/my-trips");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Fetch live weather when weather tab opens
  const fetchWeather = useCallback(async (destination) => {
    if (!destination || weather) return;
    setWeatherLoad(true);
    try {
      // Geocode destination to lat/lng using open-meteo geocoding
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) return;
      const { latitude, longitude, name, country } = geoData.results[0];
      // Fetch current + hourly forecast
      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=4`
      );
      const wxData = await wxRes.json();
      setWeather({ location: `${name}, ${country}`, ...wxData });
    } catch (_) {}
    finally { setWeatherLoad(false); }
  }, [weather]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  // ── NEW: Fetch members when Members tab opens ──────────────
  const fetchMembers = useCallback(async () => {
    if (!trip?._id) return;
    setMembersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trip-members/${trip._id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        setMemberDriver(data.driver || null);
      }
    } catch (err) {
      console.error("[Members] Error:", err);
    } finally {
      setMembersLoading(false);
    }
  }, [trip?._id]);

  useEffect(() => {
    if (activeTab === "members") fetchMembers();
  }, [activeTab, fetchMembers]);

  // ── NEW: Subscribe to group chat (Firebase) ────────────────
  useEffect(() => {
    if (activeTab !== "group-chat" || !trip?._id || !isInitialized) return;
    setChatLoading(true);

    // Sign in anonymously if needed
    if (!firebaseUser && !auth.currentUser) {
      signInAnonymously(auth).catch(console.error);
    }

    const chatRoomId = `trip_pkg_${trip._id}`;
    const unsub = subscribeToMessages(chatRoomId, (msgs) => {
      setChatMessages(msgs);
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    // Mark seen
    if (user && (firebaseUser || auth.currentUser)) {
      markSeen(chatRoomId, user?.id || user?._id);
    }

    return () => unsub();
  }, [activeTab, trip?._id, isInitialized, firebaseUser, user]);

  // ── NEW: Send group chat message ───────────────────────────
  const handleSendGroupMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatSending) return;
    if (!firebaseUser && !auth.currentUser) return;
    const chatRoomId = `trip_pkg_${trip._id}`;
    const msg = chatInput.trim();
    setChatInput("");
    setChatSending(true);
    try {
      await sendMessage(chatRoomId, {
        senderId:    user?.id || user?._id || "anon",
        senderName:  user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Traveler" : "Traveler",
        senderAvatar: user?.avatar || "",
        message:     msg,
        messageType: "text",
      });
    } catch (err) {
      console.error("[GroupChat] Send error:", err);
    } finally {
      setChatSending(false);
    }
  };

  // ── NEW: Fetch driver updates ──────────────────────────────
  const fetchDriverUpdates = useCallback(async () => {
    if (!trip?._id) return;
    setDriverUpdLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`driver-updates/${trip._id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDriverUpdates(data.updates || []);
    } catch (err) {
      console.error("[DriverUpdates] Error:", err);
    } finally {
      setDriverUpdLoading(false);
    }
  }, [trip?._id]);

  useEffect(() => {
    if (activeTab === "driver-updates") fetchDriverUpdates();
  }, [activeTab, fetchDriverUpdates]);

  // ── NEW: Socket subscription for driver updates ────────────
  useEffect(() => {
    if (!trip?._id) return;
    const handleDriverUpdate = (data) => {
      if (data.tripId === trip._id) fetchDriverUpdates();
    };
    socket.on("driver-update-posted",  handleDriverUpdate);
    socket.on("driver-update-deleted", handleDriverUpdate);
    return () => {
      socket.off("driver-update-posted",  handleDriverUpdate);
      socket.off("driver-update-deleted", handleDriverUpdate);
    };
  }, [trip?._id, fetchDriverUpdates]);

  useEffect(() => {
    if (!trip?._id) return;
    const handleBoardingOpened = (data) => {
      if (data.tripId === trip._id) {
        fetchBooking();
      }
    };
    const handleBoardingClosed = (data) => {
      if (data.tripId === trip._id) {
        fetchBooking();
      }
    };
    const handlePassengerBoarded = (data) => {
      if (data.bookingId === bookingId || data.booking?._id === bookingId) {
        fetchBooking();
      }
    };
    const handleBookingUpdated = (data) => {
      if (data.bookingId === bookingId || data.booking?._id === bookingId) {
        fetchBooking();
      }
    };

    socket.on("boarding-opened", handleBoardingOpened);
    socket.on("boarding-closed", handleBoardingClosed);
    socket.on("passenger_boarded", handlePassengerBoarded);
    socket.on("booking_updated", handleBookingUpdated);

    return () => {
      socket.off("boarding-opened", handleBoardingOpened);
      socket.off("boarding-closed", handleBoardingClosed);
      socket.off("passenger_boarded", handlePassengerBoarded);
      socket.off("booking_updated", handleBookingUpdated);
    };
  }, [bookingId, trip?._id, fetchBooking]);

  // Load weather when weather tab is active
  useEffect(() => {
    if (activeTab === "weather" && trip) {
      const dest = (trip.destinations || [])[0] || trip.title || "";
      fetchWeather(dest);
    }
  }, [activeTab, trip]);

  // Auto-generate QR if coming from MyTrips generate QR action
  useEffect(() => {
    if (location.state?.generateQr && booking && !qrToken && !qrLoading) {
      const tripStartDateStr = trip.startDate;
      const departureTimeStr = trip.departureTime || "00:00";
      if (tripStartDateStr) {
        const departureDateTime = new Date(`${tripStartDateStr}T${departureTimeStr}:00`);
        const boardingStart = new Date(departureDateTime.getTime() - 60 * 60 * 1000);
        const boardingEnd = new Date(departureDateTime.getTime() + 30 * 60 * 1000);
        const now = new Date();
        if (now >= boardingStart && now <= boardingEnd) {
          handleGenerateQr();
        } else {
          setQrError("Boarding pass is currently locked or expired.");
        }
      }
    }
  }, [location.state?.generateQr, booking, trip]);

  // Generate packing list once trip is loaded
  useEffect(() => {
    if (trip && !packingList.length) {
      setPackingList(generatePackingList(trip));
    }
  }, [trip]);

  // Load saved journal from localStorage (local-first for now)
  useEffect(() => {
    if (bookingId) {
      const saved = localStorage.getItem(`journal_${bookingId}`);
      if (saved) {
        try {
          const { text, mood } = JSON.parse(saved);
          setJournalText(text || "");
          setJournalMood(mood || "");
        } catch (_) {}
      }
      const savedExp = localStorage.getItem(`expenses_${bookingId}`);
      if (savedExp) {
        try { setExpenses(JSON.parse(savedExp)); } catch (_) {}
      }
    }
  }, [bookingId]);

  // Save notes
  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(getApiUrl(`bookings/${bookingId}/notes`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (_) {}
    finally { setNotesSaving(false); }
  };

  const togglePacking = (i) => {
    setPackingList(prev => prev.map((p, idx) => idx === i ? { ...p, packed: !p.packed } : p));
  };

  // Scroll tab into view on change
  useEffect(() => {
    if (tabRef.current) {
      const active = tabRef.current.querySelector("[data-active='true']");
      if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  // ── Extract activities from itinerary
  const extractActivities = () => {
    const activities = [];
    (trip.itinerary || []).forEach(day => {
      const segs = parseDescription(day.description);
      segs.forEach(s => {
        if (s.text && s.text.length > 4) {
          activities.push({ day: day.day, title: day.title, time: s.time, desc: s.text });
        }
      });
    });
    return activities;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="h-64 skeleton" />
        <div className="p-4 flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">🎫</p>
          <p className="text-slate-700 font-bold">Booking not found</p>
          <button onClick={() => navigate("/my-trips")} className="mt-4 text-teal-600 font-semibold text-sm">
            ← Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  if (booking.tripDeleted || (booking.status === "cancelled" && booking.tripDeleted) || (booking.agentTrip && booking.agentTrip.isDeleted) || (booking.agentTrip && booking.agentTrip.status === "deleted")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 mx-4">
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Trip Cancelled</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            This package is no longer available.<br />
            The agency has removed this trip.
          </p>
          <button
            onClick={() => navigate("/my-trips")}
            className="w-full py-3 bg-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/20 hover:bg-teal-600 active:scale-[0.98] transition-all"
          >
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  const getTravelStatus = (currentTrip) => {
    const t = currentTrip || trip;
    const b = booking;
    if (!t || !b) return "Boarding Pass Locked";

    if (b.boardingStatus === "boarded" || b.boardingStatus === "Boarded") {
      return "Checked In";
    }

    if (b.status === "cancelled" || b.paymentStatus === "Cancelled" || b.status === "Cancelled") {
      return "Cancelled";
    }

    if (t.status === "completed" || t.publishStatus === "completed" || t.boardingStatus === "COMPLETED") {
      return "Completed";
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (todayStr > (t.startDate || "")) {
      return "Expired";
    }

    if (t.boardingStatus === "OPEN") {
      return "QR Ready";
    }

    const departureTimeStr = t.departureTime || "00:00";
    const departureDateTime = new Date(`${t.startDate}T${departureTimeStr}:00`);
    const boardingStart = new Date(departureDateTime.getTime() - 60 * 60 * 1000);
    const now = new Date();

    if (todayStr < (t.startDate || "")) {
      return "Boarding Pass Locked";
    }

    if (now < boardingStart) {
      return "Waiting For Boarding Window";
    }

    return "Boarding Pass Locked";
  };

  const safeTrip = {
    destination: trip?.destination || (trip?.destinations || [])[0] || "Unknown",
    budget: trip?.budget || 0,
    activities: trip?.activities || [],
    members: trip?.members || [],
    driver: trip?.driver || null
  };

  const dest        = (trip.destinations || [])[0] || "Destination";
  const agentName   = trip.agent?.companyName || trip.agent?.displayName || "Travel Agency";
  const includedMeals = trip.mealsIncluded || [];
  const isMealIncluded = (m) => includedMeals.some(x => x.toLowerCase().includes(m.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 pb-32" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ── */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600">
        {trip.coverImage && (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)" }} />

        {/* Back button */}
        <button
          onClick={() => navigate("/my-trips")}
          className="absolute top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white active:scale-95 transition-all"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Open Itinerary Planner shortcut */}
        {userTripId && (
          <button
            onClick={() => navigate(`/build-itinerary/${userTripId}`)}
            className="absolute top-4 left-16 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/90 backdrop-blur-sm text-white text-[11px] font-bold active:scale-95 transition-all shadow"
            aria-label="Open full itinerary planner"
          >
            <ListChecks size={12} />
            Full Planner
          </button>
        )}

        {/* Agency verified chip */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow">
          <Shield size={11} />
          Agency Verified
        </div>

        {/* Title & info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-30">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white"
              style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
            >
              <Package size={9} />
              Booked Package
            </span>
            <span className="text-teal-200 text-[10px] font-mono font-bold">{booking.bookingId}</span>
          </div>
          <h1 className="text-white text-2xl font-extrabold leading-tight mb-1">
            {trip.title || "Your Trip"}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin size={13} />
              <span>{dest}</span>
            </div>
            {trip.startDate && (
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <CalendarDays size={13} />
                <span>{fmt(trip.startDate)}</span>
              </div>
            )}
            {trip.duration && (
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <Clock size={13} />
                <span>{trip.duration}</span>
              </div>
            )}
          </div>
          <p className="text-white/60 text-xs mt-1">by {agentName}</p>
        </div>
      </div>

      {/* ── PREMIUM AIRLINE BOARDING PASS CARD ── */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-955 border border-slate-800/80 rounded-3xl p-5 shadow-2xl text-white">
          <style>{`
            @keyframes shimmer {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-shimmer {
              background-size: 200% 200%;
              animation: shimmer 3s linear infinite;
            }
          `}</style>
          {/* Glassmorphism background blur effect */}
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header: Premium Boarding Pass Style */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight" style={{ background: "linear-gradient(to right, #2DD4BF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                TRAVELOOP
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono font-bold tracking-widest text-teal-400">BOARDING PASS</span>
            </div>
            
            {/* Travel Status Badge */}
            {(() => {
              const status = typeof getTravelStatus === "function" ? getTravelStatus(trip) : "UPCOMING";
              let badgeColor = "bg-slate-800 text-slate-400 border-slate-700/50";
              if (status === "Checked In") badgeColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
              else if (status === "QR Ready") badgeColor = "bg-teal-500/15 text-teal-400 border-teal-500/30";
              else if (status === "Waiting For Boarding Window") badgeColor = "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse";
              else if (status === "Completed") badgeColor = "bg-blue-500/15 text-blue-400 border-blue-500/30";
              else if (status === "Cancelled") badgeColor = "bg-rose-500/15 text-rose-455 border-rose-500/30";
              return (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${badgeColor}`}>
                  {status}
                </span>
              );
            })()}
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 mb-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-teal-400" />
              <span className="text-xs font-bold text-slate-200">Agency Verified Pass</span>
            </div>
            <span className="text-[10px] text-teal-450 font-mono font-bold">{booking.bookingId}</span>
          </div>

          {/* Ticket Body: Origin and Destination */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Origin</p>
              <h4 className="text-xl font-black text-white">{trip.originCity || "Bangalore"}</h4>
              <p className="text-xs text-slate-450 mt-0.5 truncate max-w-32">{booking.pickupLocation || trip.pickupLocation || "Main Terminal"}</p>
            </div>
            <div className="flex flex-col items-center px-4 flex-1">
              <div className="w-full flex items-center justify-between text-slate-505 relative">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <div className="border-t border-dashed border-slate-600 flex-1 mx-2 relative">
                  <Bus size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400 animate-pulse" />
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              </div>
              <span className="text-[9px] text-teal-400 font-mono mt-1 tracking-wider">{trip.duration || "N/A"}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Destination</p>
              <h4 className="text-xl font-black text-white">{(trip.destinations || [])[0] || "Destination"}</h4>
              <p className="text-xs text-slate-450 mt-0.5 truncate max-w-32">{trip.dropPoint || "Terminal Drop"}</p>
            </div>
          </div>

          {/* Passenger Details Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-b border-dashed border-white/10 pb-5 mb-5 text-xs">
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Passenger Name</p>
              <p className="text-sm font-bold text-white truncate">{booking.travelerName || "Traveler"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-455 uppercase tracking-wider">Booking ID</p>
              <p className="text-sm font-mono font-bold text-teal-400">{booking.bookingId}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Age / Gender</p>
              <p className="text-sm font-bold text-white">{booking.age || "—"} yrs · {booking.gender || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Trip Name</p>
              <p className="text-sm font-bold text-white truncate">{trip.title || "Your Trip"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Pickup Point</p>
              <p className="text-sm font-bold text-white truncate">{booking.pickupLocation || trip.pickupLocation || "Main Terminal"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Seat Number</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {(() => {
                  if (booking.boardingStatus === "boarded") {
                    return (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold">
                        Boarded
                      </span>
                    );
                  }
                  const hasSeat = booking.assignedSeat || (booking.seatNumbers && booking.seatNumbers.length > 0);
                  if (hasSeat) {
                    return (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold">
                        Seat {booking.assignedSeat || booking.seatNumbers?.join(", ")}
                      </span>
                    );
                  }
                  return (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold">
                      Waiting Assignment
                    </span>
                  );
                })()}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Driver Name</p>
              <p className="text-sm font-bold text-white truncate">{trip.driverName || "Not Assigned"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Bus Number / Type</p>
              <p className="text-sm font-bold text-white truncate">{trip.busNumber || "N/A"} · <span className="text-[10px] text-slate-400">{trip.busType}</span></p>
            </div>
            <div>
              <p className="text-[9px] text-slate-455 uppercase tracking-wider">Total Amount Paid</p>
              <p className="text-sm font-bold text-teal-400">₹{(booking.pricePaid || booking.amount || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-450 uppercase tracking-wider">Reporting Time</p>
              <p className="text-sm font-extrabold text-indigo-400">{trip.reportingTime || "N/A"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-455 uppercase tracking-wider">Departure Time</p>
              <p className="text-sm font-extrabold text-teal-400">{trip.departureTime || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] text-slate-455 uppercase tracking-wider">Emergency Contact</p>
              <p className="text-sm font-mono font-bold text-rose-450 mt-0.5">{trip.emergencyContact || "N/A"}</p>
            </div>

            {booking.travellers && booking.travellers.length > 0 && (
              <div className="col-span-2 mt-2 pt-2 border-t border-white/5 space-y-1.5">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Passengers List ({booking.travellers.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {booking.travellers.map((trav, idx) => (
                    <div key={`ticket-trav-${idx}`} className="flex justify-between text-[11px] text-white">
                      <span>{idx + 1}. {trav.name} ({trav.age} yrs · {trav.gender})</span>
                      <span className="text-teal-400 font-mono">
                        {booking.seatNumbers?.[idx] ? `Seat ${booking.seatNumbers[idx]}` : "No Seat Assigned"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ticket Footer / Action Area */}
          <div className="flex flex-col items-center w-full">
            {qrError && (
              <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-xs text-center font-semibold mb-4">
                ⚠️ {qrError}
              </div>
            )}
            {(() => {
              const state = getBoardingButtonState();
              
              if (state.statusClass === "checked-in") {
                return (
                  <div className="w-full text-center py-4 space-y-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-450 text-lg font-bold">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-400 font-extrabold text-sm uppercase tracking-wider">Successfully Checked In</p>
                      <p className="text-slate-400 text-xs">Have a safe and happy journey!</p>
                    </div>
                  </div>
                );
              }
              
              if (state.statusClass === "cancelled") {
                return (
                  <div className="w-full text-center py-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-400">
                    <p className="text-sm font-bold uppercase tracking-wider">Booking Cancelled</p>
                    <p className="text-xs mt-1">This booking is cancelled. Boarding pass deactivated.</p>
                  </div>
                );
              }
              
              if (state.statusClass === "qr-ready") {
                return (
                  <div className="w-full flex flex-col items-center space-y-4 py-2">
                    <div className="relative p-[2.5px] rounded-[24px] overflow-hidden bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500 bg-[length:200%_200%] animate-shimmer shadow-[0_0_30px_rgba(20,184,166,0.35)]">
                      <div className="bg-slate-950/95 rounded-[22px] p-5 backdrop-blur-md flex flex-col items-center">
                        <div className="bg-white p-3 rounded-2xl shadow-inner inline-block relative overflow-hidden">
                          {qrImage || booking.qrCode ? (
                            <img
                              src={qrImage || booking.qrCode}
                              alt="Boarding Pass QR Code"
                              className="w-40 h-40 object-contain mx-auto"
                            />
                          ) : (
                            <QRCodeSVG
                              value={qrToken || booking.token}
                              size={160}
                              level="H"
                              includeMargin={false}
                            />
                          )}
                        </div>

                        <div className="mt-3.5 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-black bg-teal-500/20 text-teal-400 border border-teal-500/30 animate-pulse">
                            QR Active
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-450 text-[10px] text-center italic">
                      Show this QR code to the driver to scan and verify boarding.
                    </p>
                  </div>
                );
              }

              if (state.statusClass === "open") {
                return (
                  <div className="w-full text-center space-y-3 py-2">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2 mb-2">
                      <p className="text-emerald-400 text-xs font-mono font-bold tracking-wider animate-pulse flex items-center justify-center gap-1.5">
                        <span>✨</span> Boarding Pass Available
                      </p>
                      <p className="text-[11px] text-slate-400">Boarding window is now open. Click below to generate your boarding QR code.</p>
                    </div>
                    <button
                      onClick={handleGenerateQr}
                      disabled={qrLoading}
                      className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20 active:scale-[0.985] hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode size={16} />
                      {qrLoading ? "Generating Boarding Pass..." : "Generate Boarding Pass"}
                    </button>
                  </div>
                );
              }

              if (state.statusClass === "closed") {
                return (
                  <div className="w-full text-center py-5 bg-rose-500/5 border border-rose-500/15 rounded-2xl text-rose-400">
                    <p className="text-sm font-bold uppercase tracking-wider">Boarding Closed</p>
                    <p className="text-xs mt-1 text-slate-400">Boarding has ended. You can no longer generate a boarding pass.</p>
                  </div>
                );
              }

              // countdown or locked status
              return (
                <div className="w-full text-center space-y-4 py-2">
                  <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-sm">
                      <span>🔒</span> Boarding Pass Locked
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {state.statusClass === "countdown"
                        ? "Boarding window is opening soon. Countdown active."
                        : "Waiting for driver to activate boarding pass system."}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-450 pt-2 border-t border-white/5">
                      <div>
                        <p className="text-slate-500">Scheduled Departure</p>
                        <p className="font-bold text-white mt-0.5">{trip.departureTime || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Boarding Status</p>
                        <p className="font-bold text-amber-400 mt-0.5">
                          {state.statusClass === "countdown" ? "Starts Soon" : "Not Started"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
                  >
                    {state.label}
                  </button>
                </div>
              );
            })()}

            {/* Bottom Actions Row */}
            <div className="grid grid-cols-2 gap-2 w-full mt-5 border-t border-white/10 pt-4 text-xs font-bold text-slate-300">
              <button
                onClick={() => alert("Downloading boarding pass receipt PDF...")}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/10"
              >
                📥 Download Pass
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "Boarding Pass", text: `Boarding Pass for ${trip.title}`, url: window.location.href });
                  } else {
                    alert("Share Link Copied: " + window.location.href);
                  }
                }}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/10"
              >
                🔗 Share Pass
              </button>
              <button
                onClick={() => alert("Saving pass screenshot to gallery...")}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/10 col-span-2"
              >
                🖼️ Save Image
              </button>
              <button
                onClick={() => setShowAddPassengerModal(true)}
                className="py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-teal-500/30 col-span-2 font-bold"
              >
                👤 Add Passenger
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupLocation || trip.pickupLocation || "")}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/10 text-center"
              >
                🗺️ View Route
              </a>
              <a
                href={`tel:${trip.emergencyContact || "112"}`}
                className="py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-450 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-rose-500/30"
              >
                🚨 Emergency SOS
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* ── MODULE TAB BAR ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <div ref={tabRef} className="flex gap-0 overflow-x-auto scrollbar-none">
          {MODULE_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-active={isActive ? "true" : "false"}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >

            {/* ── ITINERARY TAB ── */}
            {activeTab === "itinerary" && (
              <div className="flex flex-col gap-3">

                {/* ── LIVE STATUS BADGES STRIP ── */}
                {(() => {
                  const driverAssigned = !!(trip.driverName || trip.driver);
                  const vehicleAssigned = !!(trip.busNumber || trip.busType);
                  const paymentPaid = booking?.paymentStatus === "Paid" || booking?.paymentStatus === "paid";
                  const isBoarded = booking?.boardingStatus === "boarded" || booking?.boardingStatus === "Boarded";
                  const isCheckedIn = booking?.boardingStatus === "checked-in" || booking?.boardingStatus === "Checked-In";
                  const today = new Date().toISOString().split("T")[0];
                  const tripStarted = trip.startDate && today >= trip.startDate;
                  const tripCompleted = trip.status === "completed" || booking?.status === "completed";
                  const badges = [
                    { label: "Driver Assigned",  active: driverAssigned,  color: "bg-emerald-50 text-emerald-700 border-emerald-200",   icon: "🚗" },
                    { label: "Vehicle Assigned", active: vehicleAssigned, color: "bg-blue-50 text-blue-700 border-blue-200",           icon: "🚌" },
                    { label: "Payment Paid",     active: paymentPaid,     color: "bg-teal-50 text-teal-700 border-teal-200",           icon: "✅" },
                    { label: "Payment Pending",  active: !paymentPaid,    color: "bg-amber-50 text-amber-700 border-amber-200",        icon: "⏳" },
                    { label: "Trip Started",     active: tripStarted,     color: "bg-purple-50 text-purple-700 border-purple-200",     icon: "🚀" },
                    { label: "Checked In",       active: isCheckedIn,     color: "bg-indigo-50 text-indigo-700 border-indigo-200",     icon: "📋" },
                    { label: "Boarded",          active: isBoarded,       color: "bg-emerald-50 text-emerald-800 border-emerald-200",  icon: "🎫" },
                    { label: "Trip Completed",   active: tripCompleted,   color: "bg-slate-50 text-slate-600 border-slate-200",       icon: "🏁" },
                  ].filter(b => b.active);
                  if (!badges.length) return null;
                  return (
                    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                      {badges.map(b => (
                        <span key={b.label} className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${b.color}`}>
                          {b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                  );
                })()}
                {(trip.itinerary || []).length === 0 ? (
                  <p className="text-center text-slate-400 py-12 text-sm">No itinerary details available yet.</p>
                ) : (
                  (trip.itinerary || []).map((day, i) => {
                    const open    = expandedDay === i;
                    const segments = parseDescription(day.description);
                    return (
                      <div key={day._id || day.id || `itinerary-${day.day}-${i}`} className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                        <button
                          onClick={() => setExpandedDay(open ? -1 : i)}
                          className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                              style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                            >
                              {day.day}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="font-bold text-slate-800 text-sm leading-tight truncate">{day.title}</p>
                              {day.hotel && (
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Hotel size={10} /> {day.hotel}
                                </p>
                              )}
                            </div>
                          </div>
                          {open ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                        </button>

                        {open && (
                          <div className="px-4 pb-4 flex flex-col gap-2.5">
                            {segments.map((seg, j) => (
                              <div key={`seg-${day._id || day.id || i}-${j}`} className="flex gap-3">
                                {seg.time && (
                                  <div className="flex-shrink-0 w-20 text-right">
                                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">{seg.time}</span>
                                  </div>
                                )}
                                <div className={`flex-1 pl-3 ${seg.time ? "border-l-2 border-teal-100" : ""}`}>
                                  <p className="text-slate-700 text-sm leading-relaxed">{seg.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── HOTEL TAB ── */}
            {activeTab === "hotel" && (
              <div className="flex flex-col gap-4">
                {!trip.hotelName ? (
                  <p className="text-center text-slate-400 py-12 text-sm">No hotel details on record.</p>
                ) : (
                  <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h2 className="font-extrabold text-slate-800 text-lg">{trip.hotelName}</h2>
                        {trip.roomType && <p className="text-sm text-slate-500 mt-0.5">{trip.roomType}</p>}
                      </div>
                      {trip.hotelRating > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 flex-shrink-0">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold">{trip.hotelRating}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {trip.startDate && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Check-In</p>
                          <p className="text-sm font-bold text-slate-700">{fmt(trip.startDate)}</p>
                          {trip.departureTime && <p className="text-xs text-slate-400">{trip.departureTime}</p>}
                        </div>
                      )}
                      {trip.endDate && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Check-Out</p>
                          <p className="text-sm font-bold text-slate-700">{fmt(trip.endDate)}</p>
                          {trip.arrivalTime && <p className="text-xs text-slate-400">{trip.arrivalTime}</p>}
                        </div>
                      )}
                    </div>

                    {/* Meals included chips */}
                    {includedMeals.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Meals Included</p>
                        <div className="flex flex-wrap gap-2">
                          {includedMeals.map((m, i) => (
                            <span key={`hotel-meal-${m}-${i}`} className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                              <CheckCircle size={11} />
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancellation & Refund Policy Settings */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <AlertCircle size={18} className="text-amber-500" />
                    <h2 className="font-extrabold text-slate-800 text-base">Cancellation & Refund</h2>
                  </div>

                  {isBookingCancelled ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <p className="text-sm font-bold text-rose-700">Booking Cancelled</p>
                      </div>
                      <p className="text-xs text-rose-600">
                        This booking has been cancelled. Refund requests and seats have been released.
                      </p>
                      {booking.cancelReason && (
                        <p className="text-[11px] text-slate-500 bg-white/60 p-2 rounded-xl border border-rose-100/50">
                          <strong>Reason:</strong> {booking.cancelReason}
                        </p>
                      )}
                    </div>
                  ) : !allowCancellation ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-slate-500">Non-Refundable Booking</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        This trip does not support cancellations or refunds.
                      </p>
                    </div>
                  ) : isCancellationExpired ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-amber-700 text-amber-500">Cancellation window expired</p>
                      <p className="text-[11px] text-amber-600 mt-1">
                        The cancellation deadline of {deadline ? new Date(deadline).toLocaleString("en-IN") : "—"} has passed. Cancellation button is disabled and refund requests are unavailable.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-teal-50 border border-teal-100 rounded-2xl">
                        <p className="text-xs font-bold text-teal-800">Cancellation Policy Available</p>
                        <p className="text-[11px] text-teal-650 mt-1 leading-relaxed">
                          You can cancel this booking for a refund until{" "}
                          <strong>{deadline ? new Date(deadline).toLocaleString("en-IN") : "—"}</strong>.
                        </p>
                        {trip.refundPolicy && (
                          <p className="text-[11px] text-teal-700 mt-1.5 font-bold">
                            Policy: {trip.refundPolicy}
                          </p>
                        )}
                      </div>

                      {trip.refundPolicy === "Partial Refund" && (
                        <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-[10px]">
                          <p className="font-extrabold text-slate-500 uppercase tracking-wider">Refund Scheme</p>
                          <div className="flex justify-between text-slate-600">
                            <span>Before 7 Days:</span>
                            <span className="font-bold text-emerald-600">100% Refund</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Before 3 Days:</span>
                            <span className="font-bold text-teal-600">75% Refund</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Before 24 Hours:</span>
                            <span className="font-bold text-amber-600">50% Refund</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>After Deadline:</span>
                            <span className="font-bold text-rose-600">No Refund</span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleCancelBooking}
                        disabled={cancelLoading}
                        className="w-full py-3 bg-rose-50 text-rose-600 font-extrabold rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all text-xs tracking-wider active:scale-[0.985] flex items-center justify-center gap-1.5"
                      >
                        {cancelLoading ? "Cancelling..." : "Cancel Booking / Request Refund"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TRANSPORT TAB ── */}
            {activeTab === "transport" && (
              <div className="flex flex-col gap-4">
                {/* Bus details */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5">
                  <h2 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <Bus size={18} className="text-amber-500" /> Bus Details
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Bus Type",   value: trip.busType },
                      { label: "Bus Number", value: trip.busNumber },
                      { label: "Departure",  value: trip.departureTime },
                      { label: "Arrival",    value: trip.arrivalTime },
                    ].map(item => item.value && (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Feature chips */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[
                      { icon: Wind,  label: "AC" },
                      { icon: Wifi,  label: "WiFi" },
                      { icon: Zap,   label: "Charging" },
                      { icon: Bed,   label: "Sleeper" },
                    ].map(f => (
                      <span key={f.label} className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                        <f.icon size={11} /> {f.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Route */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5">
                  <h2 className="font-extrabold text-slate-800 text-base mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-teal-500" /> Route
                  </h2>
                  <div className="flex flex-col gap-3">
                    {trip.pickupLocation && (
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-teal-500 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Pickup</p>
                          <p className="text-sm font-bold text-slate-700">{trip.pickupLocation}</p>
                        </div>
                      </div>
                    )}
                    {(trip.pickupLocation && trip.dropPoint) && (
                      <div className="ml-1.5 w-0.5 h-6 bg-slate-200" />
                    )}
                    {trip.dropPoint && (
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-rose-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Drop</p>
                          <p className="text-sm font-bold text-slate-700">{trip.dropPoint}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver details */}
                {trip.driverName && (
                  <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5">
                    <h2 className="font-extrabold text-slate-800 text-base mb-3 flex items-center gap-2">
                      <Users size={16} className="text-violet-500" /> Driver Details
                    </h2>
                    <div className="flex items-center gap-4">
                      {trip.driverPhoto ? (
                        <img src={trip.driverPhoto} alt={trip.driverName} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🧑‍✈️</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm">{trip.driverName}</p>
                        {trip.driverLicenseNumber && <p className="text-xs text-slate-400">License: {trip.driverLicenseNumber}</p>}
                        {trip.driverExperience > 0 && <p className="text-xs text-slate-500">{trip.driverExperience} yrs experience</p>}
                        {trip.driverPhone && (
                          <a href={`tel:${trip.driverPhone}`} className="flex items-center gap-1 mt-1 text-teal-600 text-xs font-semibold">
                            <Phone size={11} /> {trip.driverPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MEALS TAB ── */}
            {activeTab === "meals" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5">
                  <h2 className="font-extrabold text-slate-800 text-base mb-4">Meal Inclusions</h2>
                  {[
                    { label: "Breakfast",  emoji: "🌅", key: "breakfast" },
                    { label: "Lunch",      emoji: "🍽️", key: "lunch" },
                    { label: "Dinner",     emoji: "🌙", key: "dinner" },
                    { label: "Snacks",     emoji: "🍿", key: "snacks" },
                  ].map(m => {
                    const included = isMealIncluded(m.label) || isMealIncluded(m.key);
                    return (
                      <div key={m.key} className={`flex items-center justify-between py-3 border-b border-slate-50 last:border-0`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="font-semibold text-slate-700 text-sm">{m.label}</span>
                        </div>
                        {included ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                            <CheckCircle size={12} />
                            Included
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-xs font-bold">
                            <XCircle size={12} />
                            Not Included
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {includedMeals.length === 0 && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-sm text-amber-700">No specific meal plan confirmed. Check with the agency for meal arrangements.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PACKING TAB ── */}
            {activeTab === "packing" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium">
                    {packingList.filter(p => p.packed).length}/{packingList.length} packed
                  </p>
                  <div
                    className="h-1.5 flex-1 mx-3 rounded-full bg-slate-100 overflow-hidden"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${packingList.length ? (packingList.filter(p => p.packed).length / packingList.length) * 100 : 0}%`,
                        background: "linear-gradient(90deg,#14B8B5,#0D9488)"
                      }}
                    />
                  </div>
                </div>

                {/* Group by category */}
                {["Documents", "Clothing", "Essentials", "Health", "Gadgets"].map(cat => {
                  const catItems = packingList.filter(p => p.cat === cat);
                  if (!catItems.length) return null;
                  return (
                    <div key={cat} className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">{cat}</p>
                      </div>
                      {catItems.map((item) => {
                        const idx = Array.isArray(packingList) ? packingList.indexOf(item) : -1;
                        return (
                          <button
                            key={item.item || idx}
                            onClick={() => togglePacking(idx)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors text-left"
                          >
                            {item.packed
                              ? <CheckSquare size={18} className="text-teal-500 flex-shrink-0" />
                              : <Square size={18} className="text-slate-300 flex-shrink-0" />
                            }
                            <span className={`text-sm flex-1 ${item.packed ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}>
                              {item.item}
                            </span>
                            {item.packed && <Check size={14} className="text-teal-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── BUDGET TAB ── */}
            {activeTab === "budget" && (
              <div className="flex flex-col gap-4">
                {/* Price card */}
                <div
                  className="rounded-2xl p-5 text-white"
                  style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                >
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Package Price</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-extrabold">
                      ₹{((trip.offerPrice || trip.pricePerPerson || 0) * (booking.seats || 1)).toLocaleString()}
                    </p>
                    <p className="text-white/60 text-sm">for {booking.seats || 1} traveller{(booking.seats || 1) > 1 ? "s" : ""}</p>
                  </div>
                  {trip.originalPrice > 0 && trip.originalPrice > (trip.offerPrice || 0) && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-white/50 line-through text-sm">₹{(trip.originalPrice * (booking.seats || 1)).toLocaleString()}</p>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                        {trip.discountPercentage || Math.round(((trip.originalPrice - trip.offerPrice) / trip.originalPrice) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* Per person breakdown */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Price Breakdown</p>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Per Person</span>
                      <span className="font-bold text-slate-800">₹{(trip.offerPrice || trip.pricePerPerson || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Travellers</span>
                      <span className="font-bold text-slate-800">× {booking.seats || 1}</span>
                    </div>
                    <div className="border-t border-slate-100 my-1" />
                    <div className="flex justify-between text-base">
                      <span className="font-extrabold text-slate-800">Amount Paid</span>
                      <span className="font-extrabold text-teal-600">₹{(booking.pricePaid || booking.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Included services */}
                {(trip.includedServices || []).length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Included in Package</p>
                    {(trip.includedServices || []).map((s, i) => (
                      <div key={`included-service-${s}-${i}`} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Excluded services */}
                {(trip.excludedServices || trip.exclusions) && (
                  <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wide mb-3">Not Included</p>
                    {(trip.excludedServices || []).length > 0
                      ? (trip.excludedServices || []).map((s, i) => (
                        <div key={`excluded-service-${s}-${i}`} className="flex items-center gap-2 py-2 border-b border-rose-100/50 last:border-0">
                          <XCircle size={14} className="text-rose-400 flex-shrink-0" />
                          <span className="text-sm text-rose-700">{s}</span>
                        </div>
                      ))
                      : <p className="text-sm text-rose-600">{trip.exclusions}</p>
                    }
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVITIES TAB ── */}
            {activeTab === "activities" && (
              <div className="flex flex-col gap-3">
                {extractActivities().length === 0 ? (
                  <p className="text-center text-slate-400 py-12 text-sm">No specific activities listed.</p>
                ) : (
                  extractActivities().map((act, i) => (
                    <motion.div
                      key={`activity-${act.day}-${i}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-xl shadow-xs border border-slate-100 p-4 flex gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                      >
                        {act.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        {act.time && <p className="text-[10px] font-bold text-slate-400 mb-0.5">{act.time}</p>}
                        <p className="text-sm text-slate-700 leading-relaxed">{act.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{act.title}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* ── NOTES TAB ── */}
            {activeTab === "notes" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                  <div className="p-4 border-b border-slate-50">
                    <p className="font-bold text-slate-700 text-sm">Personal Travel Notes</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add your own instructions, meeting point, reminders, etc.</p>
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={"E.g.:\n- Reach pickup point 15 min early\n- Carry cash for entry fees\n- Emergency contact: +91 98765 43210"}
                    className="w-full p-4 text-sm text-slate-700 outline-none resize-none bg-transparent"
                    rows={10}
                  />
                </div>

                {trip.emergencyContact && (
                  <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-2">Agency Emergency Contact</p>
                    <a href={`tel:${trip.emergencyContact}`} className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <Phone size={15} />
                      {trip.emergencyContact}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── WEATHER TAB ── */}
            {activeTab === "weather" && (
              <div className="flex flex-col gap-4">
                {weatherLoad && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <RefreshCw size={28} className="text-teal-400 animate-spin" />
                    <p className="text-sm text-slate-400">Fetching live weather…</p>
                  </div>
                )}
                {!weatherLoad && !weather && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                    <CloudSun size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 text-sm">Weather data unavailable for this destination.</p>
                  </div>
                )}
                {weather && weather.current && (
                  <>
                    {/* Current weather card */}
                    <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">
                        <MapPin size={10} className="inline mr-1" />{weather.location}
                      </p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-5xl font-extrabold">{Math.round(weather.current.temperature_2m)}°C</p>
                          <p className="text-white/80 text-sm mt-1">Feels like {Math.round(weather.current.apparent_temperature)}°C</p>
                        </div>
                        <CloudSun size={56} className="text-white/40" />
                      </div>
                      <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-1 text-white/80 text-xs">
                          <Droplets size={12} /> {weather.current.relative_humidity_2m}% Humidity
                        </div>
                        <div className="flex items-center gap-1 text-white/80 text-xs">
                          <Wind size={12} /> {weather.current.wind_speed_10m} km/h Wind
                        </div>
                      </div>
                    </div>

                    {/* 3-Day Forecast */}
                    {weather.daily && (
                      <div className="bg-white rounded-2xl border border-slate-100 p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">3-Day Forecast</p>
                        <div className="flex gap-3">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className="flex-1 bg-sky-50 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-slate-400 font-semibold mb-2">
                                {i === 0 ? "Today" : new Date(weather.daily.time[i]).toLocaleDateString("en-IN", { weekday: "short" })}
                              </p>
                              <CloudSun size={18} className="mx-auto text-sky-500 mb-1" />
                              <p className="text-sm font-bold text-slate-700">{Math.round(weather.daily.temperature_2m_max[i])}°</p>
                              <p className="text-[10px] text-slate-400">{Math.round(weather.daily.temperature_2m_min[i])}°</p>
                              {weather.daily.precipitation_sum[i] > 0 && (
                                <p className="text-[10px] text-blue-500 mt-1">{weather.daily.precipitation_sum[i]}mm 🌧️</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Travel Tips */}
                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Travel Tips</p>
                      <ul className="space-y-1 text-sm text-amber-800">
                        {weather.current.temperature_2m > 30 && <li>☀️ Pack sunscreen — it will be hot!</li>}
                        {weather.current.temperature_2m < 15 && <li>🧥 Carry a warm jacket — temperatures are low.</li>}
                        {weather.current.wind_speed_10m > 30 && <li>💨 Expect strong winds — secure loose items.</li>}
                        {weather.current.relative_humidity_2m > 80 && <li>💧 High humidity — stay hydrated.</li>}
                        <li>📱 Check weather again on departure day.</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── JOURNAL TAB ── */}
            {activeTab === "journal" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <h2 className="font-extrabold text-slate-800 text-base mb-1 flex items-center gap-2">
                    <BookOpen size={18} className="text-violet-500" /> Travel Journal
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">Your private travel memories, reflections, and highlights.</p>

                  {/* Mood Picker */}
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Today's Mood</p>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {["😊 Happy", "😌 Relaxed", "🥳 Excited", "😴 Tired", "🤩 Amazing", "😤 Frustrated"].map(m => (
                      <button
                        key={m}
                        onClick={() => setJournalMood(m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          journalMood === m
                            ? "bg-violet-500 text-white border-violet-500 shadow"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Journal Entry */}
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Daily Log</p>
                  <textarea
                    value={journalText}
                    onChange={e => setJournalText(e.target.value)}
                    placeholder="Write about today's adventure…\n- What did you see?\n- Who did you meet?\n- What was your favourite moment?"
                    className="w-full p-3 text-sm text-slate-700 border border-slate-200 rounded-xl outline-none resize-none bg-slate-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all"
                    rows={8}
                  />

                  <button
                    onClick={() => {
                      localStorage.setItem(`journal_${bookingId}`, JSON.stringify({ text: journalText, mood: journalMood }));
                      setJournalSaved(true);
                      setTimeout(() => setJournalSaved(false), 2000);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm transition-all"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
                  >
                    {journalSaved ? <Check size={15} /> : <Save size={15} />}
                    {journalSaved ? "Saved!" : "Save Journal"}
                  </button>
                </div>

                {userTripId && (
                  <button
                    onClick={() => navigate(`/build-itinerary/${userTripId}`)}
                    className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-center justify-between text-violet-700"
                  >
                    <div className="flex items-center gap-2">
                      <ListChecks size={18} />
                      <span className="font-bold text-sm">Open Full Trip Planner</span>
                    </div>
                    <ArrowLeft size={14} className="rotate-180" />
                  </button>
                )}
              </div>
            )}

            {/* ── EXPENSES TAB ── */}
            {activeTab === "expenses" && (
              <div className="flex flex-col gap-4">
                {/* Summary card */}
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Total Spent</p>
                  <p className="text-4xl font-extrabold">
                    ₹{expenses.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    Package budget: ₹{(booking.pricePaid || 0).toLocaleString()}
                  </p>
                </div>

                {/* Add expense form */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Add Extra Expense</p>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="What did you spend on?"
                      value={expenseForm.label}
                      onChange={e => setExpenseForm(f => ({ ...f, label: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400 transition-all"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount ₹"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400 transition-all"
                      />
                      <select
                        value={expenseForm.category}
                        onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-teal-400 transition-all"
                      >
                        {["Food", "Shopping", "Transport", "Activities", "Miscellaneous"].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (!expenseForm.label || !expenseForm.amount) return;
                        const newExp = [
                          ...expenses,
                          { ...expenseForm, id: Date.now(), date: new Date().toLocaleDateString("en-IN") }
                        ];
                        setExpenses(newExp);
                        localStorage.setItem(`expenses_${bookingId}`, JSON.stringify(newExp));
                        setExpenseForm({ label: "", amount: "", category: "Food" });
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm"
                      style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                    >
                      <PlusCircle size={15} />
                      Add Expense
                    </button>
                  </div>
                </div>

                {/* Expense list */}
                {expenses.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50">
                      <p className="font-bold text-slate-700 text-sm">Expense Log</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {expenses.map((exp, i) => (
                        <div key={`exp-${exp.id || exp._id || i}-${i}`} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{exp.label}</p>
                            <p className="text-xs text-slate-400">{exp.category} · {exp.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-slate-800">₹{Number(exp.amount).toLocaleString()}</p>
                            <button
                              onClick={() => {
                                const updated = expenses.filter((_, j) => j !== i);
                                setExpenses(updated);
                                localStorage.setItem(`expenses_${bookingId}`, JSON.stringify(updated));
                              }}
                              className="text-rose-400 active:scale-90 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-8 text-center">
                    <Wallet size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 text-sm">No extra expenses logged yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                 NEW TAB 1 — TRIP MEMBERS
            ══════════════════════════════════════════════════ */}
            {activeTab === "members" && (
              <div className="flex flex-col gap-4 pb-24">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">Trip Members</h3>
                  <span className="text-xs text-slate-400">{members.length + (memberDriver ? 1 : 0)} total</span>
                </div>

                {membersLoading ? (
                  <div className="flex gap-3 flex-wrap">
                    {[1,2,3,4].map(i => <div key={i} className="w-16 h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
                  </div>
                ) : (
                  <>
                    {/* Driver card — prominently shown at top */}
                    {memberDriver && (
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          {memberDriver.photo ? (
                            <img src={memberDriver.photo} alt={memberDriver.name} className="w-14 h-14 rounded-full object-cover border-2 border-teal-300" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold border-2 border-teal-300">
                              {(memberDriver.name || "D")[0].toUpperCase()}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 text-xs">🚗</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{memberDriver.name}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold border border-teal-200">
                            <BadgeCheck size={10} /> Your Driver
                          </span>
                          {memberDriver.phone && (
                            <a href={`tel:${memberDriver.phone}`} className="flex items-center gap-1 text-teal-600 text-xs mt-1">
                              <Phone size={11} /> {memberDriver.phone}
                            </a>
                          )}
                        </div>
                        <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          memberDriver.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {memberDriver.status === "active" ? "Active" : "Pending"}
                        </span>
                      </div>
                    )}

                    {/* Passenger grid */}
                    {members.length === 0 ? (
                      <div className="text-center py-12">
                        <Users size={40} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm">No other passengers yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {members.map((m, i) => (
                          <div key={`member-${m._id || m.id || i}-${i}`} className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center text-center gap-2 shadow-xs">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold"
                                style={{ background: ["linear-gradient(135deg,#667EEA,#764BA2)","linear-gradient(135deg,#4FACFE,#00F2FE)","linear-gradient(135deg,#43E97B,#38F9D7)","linear-gradient(135deg,#FA709A,#FEE140)","linear-gradient(135deg,#14B8B5,#0D9488)"][i % 5] }}
                              >
                                {(m.name || "T")[0].toUpperCase()}
                              </div>
                            )}
                            <p className="text-xs font-semibold text-slate-700 truncate w-full">{m.name}</p>
                            <p className="text-[10px] text-slate-400">{m.gender || "—"} {m.age ? `· ${m.age}y` : ""}</p>
                            {m.assignedSeat && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-100 font-semibold">
                                Seat {m.assignedSeat}
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              m.boardingStatus === "Boarded" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              m.boardingStatus === "Checked-In" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              m.status === "confirmed" ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {m.boardingStatus === "Boarded" ? "Boarded" :
                               m.boardingStatus === "Checked-In" ? "Checked In" :
                               m.status === "confirmed" ? "Confirmed" : "Pending"}
                            </span>
                            <p className="text-[9px] text-slate-300">Joined {new Date(m.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                 NEW TAB 2 — GROUP CHAT
            ══════════════════════════════════════════════════ */}
            {activeTab === "group-chat" && (
              <div className="flex flex-col" style={{ height: "calc(100vh - 240px)" }}>
                {/* Header info */}
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white">
                    <MessageCircle size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Trip Group</p>
                    <p className="text-[10px] text-slate-400">Talk with travelers, driver and organizer</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-3">
                  {chatLoading && <p className="text-center text-xs text-slate-400 py-6">Loading messages…</p>}
                  {!chatLoading && chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <MessageCircle size={36} className="text-slate-200" />
                      <p className="text-slate-400 text-sm">No messages yet. Say hello to your group! 👋</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => {
                    const isMe = msg.senderId === (user?.id || user?._id);
                    const isDriver = msg.senderRole === "driver" || msg.senderName?.toLowerCase().includes("driver");
                    return (
                      <div key={`msg-${msg.id || msg._id || i}-${i}`} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                          isMe ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-tr-sm" :
                          isDriver ? "bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-slate-800 rounded-tl-sm" :
                          "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                        }`}>
                          {!isMe && (
                            <p className={`text-[10px] font-bold mb-0.5 ${isDriver ? "text-indigo-600" : "text-teal-600"}`}>
                              {isDriver ? "🚗 " : ""}{msg.senderName || "Traveler"}
                            </p>
                          )}
                          {msg.messageType === "image" && msg.fileUrl ? (
                            <img src={msg.fileUrl} alt="img" className="max-w-full rounded-xl" />
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                          )}
                          <p className={`text-[9px] mt-1 ${isMe ? "text-white/60" : "text-slate-400"}`}>
                            {msg.createdAt ? new Date(msg.createdAt?.toDate ? msg.createdAt.toDate() : msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input bar */}
                <form onSubmit={handleSendGroupMessage} className="flex gap-2 pt-2 border-t border-slate-100 flex-shrink-0">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Message the group…"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatSending}
                    className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                 NEW TAB 3 — DRIVER UPDATES
            ══════════════════════════════════════════════════ */}
            {activeTab === "driver-updates" && (
              <div className="flex flex-col gap-3 pb-24">
                {/* Info banner */}
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl p-3">
                  <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">Only your driver can post updates here. You will receive pickup timings, delays, and live alerts.</p>
                </div>

                {driverUpdLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
                  </div>
                ) : driverUpdates.length === 0 ? (
                  <div className="text-center py-16">
                    <Truck size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm">No driver updates yet.</p>
                    <p className="text-slate-300 text-xs mt-1">Your driver will post pickup timings, alerts and live updates here.</p>
                  </div>
                ) : (
                  driverUpdates.map((upd, i) => {
                    const typeConfig = {
                      alert:    { icon: <AlertTriangle size={14} />, color: "bg-amber-50 border-amber-200 text-amber-700", badge: "bg-amber-100 text-amber-700" },
                      delay:    { icon: <Clock size={14} />,          color: "bg-rose-50 border-rose-200 text-rose-700",    badge: "bg-rose-100 text-rose-700" },
                      location: { icon: <Navigation size={14} />,     color: "bg-green-50 border-green-200 text-green-700", badge: "bg-green-100 text-green-700" },
                      vehicle:  { icon: <Truck size={14} />,          color: "bg-purple-50 border-purple-200 text-purple-700", badge: "bg-purple-100 text-purple-700" },
                      pickup:   { icon: <MapPin size={14} />,         color: "bg-teal-50 border-teal-200 text-teal-700",    badge: "bg-teal-100 text-teal-700" },
                      arrival:  { icon: <CheckCircle size={14} />,    color: "bg-emerald-50 border-emerald-200 text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
                      info:     { icon: <Info size={14} />,           color: "bg-blue-50 border-blue-200 text-blue-700",     badge: "bg-blue-100 text-blue-700" },
                    };
                    const cfg = typeConfig[upd.type] || typeConfig.info;
                    return (
                      <div key={`upd-${upd._id || upd.id || i}-${i}`} className={`border rounded-2xl p-4 ${cfg.color}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.badge}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-bold">{upd.driverName || "Driver"}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${cfg.badge}`}>
                                {upd.type}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{upd.message}</p>
                            {upd.locationData?.mapsUrl && (
                              <a href={upd.locationData.mapsUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold mt-2 underline">
                                <Navigation size={10} /> View on Maps
                              </a>
                            )}
                            <p className="text-[9px] opacity-60 mt-1">
                              {upd.createdAt ? new Date(upd.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Refresh button */}
                {!driverUpdLoading && (
                  <button
                    onClick={fetchDriverUpdates}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold active:scale-[0.98] transition-all"
                  >
                    <RefreshCw size={12} /> Refresh Updates
                  </button>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FLOATING FOOTER ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        {activeTab === "notes" ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={saveNotes}
            disabled={notesSaving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm transition-all"
            style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
          >
            {notesSaved ? <Check size={16} /> : <Save size={16} />}
            {notesSaving ? "Saving…" : notesSaved ? "Saved!" : "Save Notes"}
          </motion.button>
        ) : (
          <>
            {trip.emergencyContact && (
              <a
                href={`tel:${trip.emergencyContact}`}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm flex-shrink-0"
              >
                <Phone size={15} />
                SOS
              </a>
            )}
            
            {/* Boarding Pass button (active on travel day within boarding window) */}
            {trip.startDate && (() => {
              const status = typeof getTravelStatus === "function" ? getTravelStatus(trip) : "UPCOMING";

              if (status === "Checked In") {
                return (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-2xl text-white font-extrabold text-sm bg-emerald-500 shadow-md flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle size={15} />
                    Boarded
                  </button>
                );
              }

              if (status === "Boarding Pass Locked") {
                return (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-2xl text-slate-400 font-extrabold text-sm bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Clock size={15} />
                    Locked
                  </button>
                );
              }

              if (status === "Expired") {
                return (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-2xl text-slate-400 font-extrabold text-sm bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <XCircle size={15} />
                    Expired
                  </button>
                );
              }

              if (status === "Cancelled") {
                return (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-2xl text-slate-400 font-extrabold text-sm bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <XCircle size={15} />
                    Cancelled
                  </button>
                );
              }

              const hasGenerated = qrToken || booking.token;

              return (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={hasGenerated ? () => setShowQrModal(true) : handleGenerateQr}
                  disabled={qrLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-white font-bold text-sm bg-gradient-to-r from-teal-500 to-emerald-600 shadow animate-pulse"
                >
                  <QrCode size={15} />
                  {qrLoading ? "Generating..." : hasGenerated ? "View Boarding Pass" : "Generate Boarding Pass"}
                </motion.button>
              );
            })()}

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/my-trips")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
            >
              <ArrowLeft size={15} />
              My Trips
            </motion.button>
          </>
        )}
      </div>

      {/* ── QR CODE MODAL ── */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-4 text-teal-400">
                <QrCode size={24} />
              </div>
              <h3 className="text-white font-extrabold text-lg">Boarding Pass QR</h3>
              <p className="text-slate-400 text-xs mt-1">Show this to the driver when boarding</p>

              <div className="bg-white p-4 rounded-2xl inline-block my-6 shadow-xl">
                {qrImage ? (
                  <img
                    src={qrImage}
                    alt="Boarding Pass QR Code"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                ) : qrToken ? (
                  <QRCodeSVG
                    value={qrToken}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                ) : null}
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-4 text-left space-y-2 mb-6 max-h-60 overflow-y-auto">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Passenger Name</span>
                  <span className="font-bold text-white">{booking.travelerName || "Traveler"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Booking ID</span>
                  <span className="font-mono font-bold text-white">{booking.bookingId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Seat Number</span>
                  <span className="font-bold text-teal-400">{booking.assignedSeat || "Driver will assign"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Trip Name</span>
                  <span className="font-bold text-white text-right max-w-[180px] truncate">{trip.title || "Your Trip"}</span>
                </div>
                {trip.departureTime && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Departure Time</span>
                    <span className="font-bold text-white">{trip.departureTime}</span>
                  </div>
                )}
                {(booking.pickupLocation || trip.pickupLocation) && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Pickup Point</span>
                    <span className="font-bold text-white text-right max-w-[180px] truncate">{booking.pickupLocation || trip.pickupLocation}</span>
                  </div>
                )}
                {trip.busNumber && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Bus Number</span>
                    <span className="font-bold text-white">{trip.busNumber}</span>
                  </div>
                )}
                {trip.driverName && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Driver Name</span>
                    <span className="font-bold text-white">{trip.driverName}</span>
                  </div>
                )}
                {trip.emergencyContact && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Emergency Contact</span>
                    <span className="font-bold text-rose-400">{trip.emergencyContact}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── ADD PASSENGER MODAL ── */}
      <AnimatePresence>
        {showAddPassengerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddPassengerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-slate-800 text-left border border-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-850 text-base">Add Passenger Details</h3>
                <button onClick={() => setShowAddPassengerModal(false)} className="text-slate-400 font-extrabold text-sm hover:text-slate-650">✕</button>
              </div>

              <form onSubmit={handleAddPassengerPayment} className="space-y-3.5 mt-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Passenger Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={newPassenger.name}
                    onChange={e => setNewPassenger(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Age</label>
                    <input
                      type="number"
                      required
                      placeholder="Age"
                      value={newPassenger.age}
                      onChange={e => setNewPassenger(prev => ({ ...prev, age: e.target.value }))}
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gender</label>
                    <select
                      value={newPassenger.gender}
                      onChange={e => setNewPassenger(prev => ({ ...prev, gender: e.target.value }))}
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-teal-400 transition-all"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Seat Preference</label>
                    <input
                      type="text"
                      placeholder="e.g. 12A, Window"
                      value={newPassenger.seat}
                      onChange={e => setNewPassenger(prev => ({ ...prev, seat: e.target.value }))}
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newPassenger.phone}
                      onChange={e => setNewPassenger(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Emergency Contact</label>
                  <input
                    type="tel"
                    placeholder="Emergency Contact Phone"
                    value={newPassenger.emergencyContact}
                    onChange={e => setNewPassenger(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-400 transition-all"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-650">
                  <span>Additional Amount:</span>
                  <span className="text-teal-600 text-sm">₹{(trip.offerPrice || trip.pricePerPerson || 0).toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  disabled={addPassengerLoading}
                  className="mt-2 w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow shadow-teal-500/20 active:scale-[0.985] hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                >
                  💳 {addPassengerLoading ? "Processing payment..." : "Pay & Add Passenger"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookedPackageDetail;
