// src/pages/TripDetails.jsx â Published Group Trip Details & Booking Flow
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Star, MapPin, Calendar, Users, Compass,
  CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert,
  ChevronRight, Phone, Mail, Award, Info, Heart, CreditCard, Sparkles, Navigation, X, Clock, Eye, Loader2
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import SeatLayoutModal from "../components/trip/SeatLayoutModal";
import PassengerFormModal from "../components/trip/PassengerFormModal";
import UPIPaymentModal from "../components/trip/UPIPaymentModal";
import TicketModal from "../components/trip/TicketModal";
import RedeemCodeModal from "../components/trip/RedeemCodeModal";
import PassengerCountModal from "../components/trip/PassengerCountModal";

const PackingChecklistItem = ({ item }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div
      onClick={() => setChecked(!checked)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
        checked
          ? "bg-teal-50/30 dark:bg-teal-950/10 border-teal-200/50 dark:border-teal-900/40 text-teal-655 dark:text-teal-400"
          : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100/50 dark:border-slate-850 text-slate-600 dark:text-slate-355 hover:border-slate-250"
      }`}
    >
      <div className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all ${
        checked
          ? "bg-teal-500 border-teal-500 text-white"
          : "border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-800"
      }`}>
        {checked && <CheckCircle2 size={12} className="stroke-[3.5]" />}
      </div>
      <span className={`text-xs font-semibold ${checked ? "line-through opacity-70" : ""}`}>{item}</span>
    </div>
  );
};

export const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isDeadlinePassed = trip
    ? (trip.status === "closed" || (trip.bookingDeadline ? new Date() > new Date(trip.bookingDeadline) : false))
    : false;
  const bookingDeadlineFormatted = trip && trip.bookingDeadline ? new Date(trip.bookingDeadline).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "";
  const pickupPoint = trip?.pickupLocation || trip?.pickupPoint || trip?.meetingPoint || "";
  const dropPoint = trip?.dropPoint || trip?.destination || trip?.dropLocation || "";
  const coverImageUrl = trip?.coverImages?.[0] || trip?.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
  const itineraryItems = trip?.itinerary || [];
  const hotelItems = trip?.hotels || [];
  const activityItems = trip?.activities || [];
  const packingItems = trip?.packingChecklist || [];

  // Booking Flow States
  const [showBookingModal, setShowBookingModal] = useState(false);
  // stages: "count_select" | "seat_select" | "passenger_form" | "redeem_code" | "upi_payment" | "ticket" | "form" | "seats" | "confirm" | "payment" | "success"
  const [bookingStage, setBookingStage] = useState("count_select");
  const [bookingDetails, setBookingDetails] = useState(null);
  // Passenger count chosen in PassengerCountModal (step 0)
  const [passengerCount, setPassengerCount] = useState(1);
  const [bookedSeats, setBookedSeats] = useState([]);

  // New seat-reservation flow state
  const [selectedSeats, setSelectedSeats] = useState([]);
  const setSelectedSeatsList = setSelectedSeats;
  const [passengers, setPassengers] = useState([]);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");

  // ── Booking flow progress flags (prevent modal re-open loop) ──────────────
  const [seatSelected, setSeatSelected] = useState(false);
  const [passengerSaved, setPassengerSaved] = useState(false);
  const [passengerCompleted, setPassengerCompleted] = useState(false);
  const [bookingDraftCreated, setBookingDraftCreated] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Seat selection state

  // Additional travelers
  const [additionalTravellers, setAdditionalTravellers] = useState([]);

  // Referral State
  const [referralInfo, setReferralInfo] = useState({
    referralCode: "",
    referredBy: "",
    referralDiscountPercent: 5,
    isEligibleForDiscount: false
  });

  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [typedCoupon, setTypedCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!typedCoupon.trim()) {
      setCouponError("Coupon Code is required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("payment/validate-coupon"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ couponCode: typedCoupon })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({
          couponCode: data.couponCode,
          discountPercent: data.discountPercent
        });
        setSelectedCoupon(data.couponCode);
        toast.success("Coupon applied successfully!");
        
        // Recalculate price
        const basePrice = trip.offerPrice || trip.pricePerPerson || 0;
        const childPrice = Math.round(basePrice * 0.5);
        const adultsSubtotal = adults * basePrice;
        const childrenSubtotal = children * childPrice;
        const subtotal = adultsSubtotal + childrenSubtotal;
        const tax = Math.round(subtotal * 0.05);
        const convenienceFee = 150;
        
        const discountAmt = Math.round(subtotal * (data.discountPercent / 100));
        const grandTotal = subtotal - discountAmt + tax + convenienceFee;
        
        setBookingDetails(prev => ({
          ...prev,
          pricePaid: grandTotal,
          referralApplied: true,
          referralCode: data.couponCode,
          referralDiscountPercent: data.discountPercent,
          referralDiscountAmount: discountAmt,
        }));
      } else {
        setCouponError(data.message || "Coupon Invalid");
        toast.error(data.message || "Coupon Invalid");
      }
    } catch (err) {
      setCouponError("Error validating coupon");
      toast.error("Error validating coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setTypedCoupon("");
    setCouponError("");
    setSelectedCoupon("");
    
    // Recalculate price back to default (either referral discount if eligible, or no discount)
    const basePrice = trip.offerPrice || trip.pricePerPerson || 0;
    const childPrice = Math.round(basePrice * 0.5);
    const adultsSubtotal = adults * basePrice;
    const childrenSubtotal = children * childPrice;
    const subtotal = adultsSubtotal + childrenSubtotal;
    const tax = Math.round(subtotal * 0.05);
    const convenienceFee = 150;
    
    let referralDiscountAmount = 0;
    let referralApplied = false;
    let referralCode = "";
    let referralDiscountPercent = 0;
    
    if (referralInfo.isEligibleForDiscount) {
      referralApplied = true;
      referralCode = referralInfo.referredBy;
      referralDiscountPercent = referralInfo.referralDiscountPercent;
      referralDiscountAmount = Math.round(subtotal * (referralDiscountPercent / 100));
    }
    
    const grandTotal = subtotal - referralDiscountAmount + tax + convenienceFee;
    
    setBookingDetails(prev => ({
      ...prev,
      pricePaid: grandTotal,
      referralApplied,
      referralCode,
      referralDiscountPercent,
      referralDiscountAmount,
    }));
  };

  // Derive total seats
  const totalBookingSeats = Number(adults) + Number(children);

  useEffect(() => {
    const additionalCount = Math.max(0, totalBookingSeats - 1);
    setAdditionalTravellers(prev => {
      const next = [...prev];
      if (next.length < additionalCount) {
        while (next.length < additionalCount) {
          next.push({ name: "", age: "", gender: "Male", phone: "" });
        }
      } else if (next.length > additionalCount) {
        next.splice(additionalCount);
      }
      return next;
    });
  }, [totalBookingSeats]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        console.log("Trip ID:", id);
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(getApiUrl(`trips/published/${id}`), { headers });
        const responseData = await res.json();
        console.log("Trip API Response:", responseData);
        console.log("Mapped Trip:", responseData?.trip);
        console.log("Images:", responseData?.trip?.coverImages || responseData?.trip?.images);
        console.log("Itinerary:", responseData?.trip?.itinerary);
        console.log("Hotels:", responseData?.trip?.hotels);
        console.log("Transport:", responseData?.trip?.transport);
        console.log("Activities:", responseData?.trip?.activities);
        console.log("Packing:", responseData?.trip?.packingChecklist);
        if (responseData.success && responseData.trip) {
          setTrip(responseData.trip);
          setBookedSeats(responseData.bookedSeatNumbers || []);
          if (responseData.trip.pickupLocation) {
            setPickupLocation(responseData.trip.pickupLocation);
          }
        } else if (responseData.success && !responseData.trip) {
          setError("No trip details available");
        } else {
          setError(responseData.message || "Trip not found");
        }
      } catch (err) {
        setError("Error connecting to server. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTripDetails();
  }, [id]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchReferralInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("profile/referral-dashboard"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setReferralInfo(data);
        }
      } catch (err) {
        console.warn("Error fetching referral info:", err);
      }
    };
    fetchReferralInfo();
  }, []);

  const recalculatePrice = (couponCode) => {
    const basePrice = trip.offerPrice || trip.pricePerPerson || 0;
    const childPrice = Math.round(basePrice * 0.5);
    const adultsSubtotal = adults * basePrice;
    const childrenSubtotal = children * childPrice;
    const subtotal = adultsSubtotal + childrenSubtotal;
    const tax = Math.round(subtotal * 0.05);
    const convenienceFee = 150;

    let referralDiscountAmount = 0;
    let referralApplied = false;
    let referralCode = "";
    let referralDiscountPercent = 0;

    if (couponCode) {
      const couponCard = referralInfo.scratchCards.find(c => c.couponCode === couponCode);
      if (couponCard) {
        referralApplied = true;
        referralCode = couponCode;
        if (couponCard.rewardType === "percentage_discount") {
          referralDiscountPercent = parseInt(couponCard.rewardValue);
          referralDiscountAmount = Math.round(subtotal * (referralDiscountPercent / 100));
        }
      }
    } else if (referralInfo.isEligibleForDiscount) {
      referralApplied = true;
      referralCode = referralInfo.referredBy;
      referralDiscountPercent = referralInfo.referralDiscountPercent;
      referralDiscountAmount = Math.round(subtotal * (referralDiscountPercent / 100));
    }

    const grandTotal = subtotal - referralDiscountAmount + tax + convenienceFee;

    setBookingDetails(prev => ({
      ...prev,
      pricePaid: grandTotal,
      referralApplied,
      referralCode,
      referralDiscountPercent,
      referralDiscountAmount,
    }));
  };

  const handleOpenBooking = () => {
    if (!trip) {
      toast.error("Trip details are still loading. Please wait.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to book this trip.");
      navigate("/login");
      return;
    }
    // Reset all booking state for a fresh booking, open count selection first
    setBookingStage("count_select");
    setPassengerCount(1);
    setSelectedSeats([]);
    setPassengers([]);
    setConfirmedBooking(null);
    setTicketData(null);
    setSeatSelected(false);
    setPassengerSaved(false);
    setPassengerCompleted(false);
    setBookingDraftCreated(false);
    setPaymentStarted(false);
    setPaymentCompleted(false);
    setAppliedCouponCode("");
    setShowBookingModal(true);
  };

  // Called when PassengerCountModal confirms the count
  const handleCountConfirmed = (count) => {
    setPassengerCount(count);
    setBookingStage("seat_select");
  };

  // Called when SeatLayoutModal confirms seat selection
  // SeatLayoutModal already collects per-seat passenger details in its drawer,
  // so we skip PassengerFormModal and go directly to booking creation.
  const handleSeatsConfirmed = (seats, passengerList) => {
    console.log("Seat Selected:", seats);
    setSelectedSeats(seats);
    setSeatSelected(true);
    if (passengerList && passengerList.length > 0) {
      setPassengers(passengerList);
      setPassengerSaved(true);
      setPassengerCompleted(true);
      console.log("Passenger Saved");
      // Pass seats explicitly to avoid React state-lag (selectedSeats may still be [])
      setBookingStage("redeem_code");
    } else {
      // No passenger data from SeatLayoutModal — show PassengerFormModal
      setBookingStage("passenger_form");
    }
  };

  // Called when PassengerFormModal submits all passenger data
  // Also called directly from SeatLayoutModal.onConfirm with explicit seats override.
  const handlePassengersConfirmed = async (passengerList, seatsOverride, couponCode = "") => {
    // Guard: if booking draft already created, skip duplicate creation
    if (bookingDraftCreated && confirmedBooking) {
      console.log("[BookingFlow] Draft already created, going directly to payment.");
      setPassengerSaved(true);
      setPassengerCompleted(true);
      setBookingStage("upi_payment");
      return;
    }

    if (creatingBooking) {
      console.warn("[BookingFlow] Booking creation already in progress. Ignoring duplicate call.");
      return;
    }

    setPassengers(passengerList);
    // CRITICAL FIX: Use explicit seats override to bypass React state lag
    // When called from SeatLayoutModal.onConfirm, selectedSeats state may still be []
    const activeSeats = seatsOverride || selectedSeats;

    if (!activeSeats || activeSeats.length === 0) {
      console.error("[BookingFlow] No seats available:", { seatsOverride, selectedSeats });
      toast.error("No seats selected. Please select your seat(s) first.");
      setBookingStage("seat_select");
      return;
    }

    console.log("[STEP 2] Validation Passed: Seat and passenger validation succeeded.");

    // Calculate amounts
    const basePrice = trip.offerPrice || trip.pricePerPerson || 0;
    const tax = Math.round(basePrice * passengerList.length * 0.05);
    const convenienceFee = 150;
    const total = basePrice * passengerList.length + tax + convenienceFee;

    const maleCount = passengerList.filter(p => p.gender === "Male").length;
    const femaleCount = passengerList.filter(p => p.gender === "Female").length;

    // Derive accountEmail from authenticated user profile
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    const localUserId = localUser?._id || localUser?.id;
    
    // Robust accountEmail derivation as requested
    const accountEmail =
      localUser?.email ||
      (typeof user !== "undefined" ? user?.email : "") ||
      (typeof profile !== "undefined" ? profile?.email : "") ||
      (passengerList && passengerList[0]?.email) ||
      (passengerList && passengerList[0]?.contactEmail) ||
      "";

    // Validate accountEmail before booking creation
    if (!accountEmail || !accountEmail.includes("@")) {
      console.error("[BookingFlow] Missing or invalid accountEmail:", accountEmail);
      toast.error("Account email is required for booking. Please ensure your profile has a valid email.");
      setBookingStage("passenger_form");
      return;
    }

    if (!localUserId) {
      toast.error("User session expired. Please log in again to book.");
      setBookingStage("passenger_form");
      return;
    }

    // Enrich passengers with account email
    const enrichedPassengers = passengerList.map(p => ({
      ...p,
      accountEmail: p.accountEmail || accountEmail,
      contactEmail: p.contactEmail || accountEmail,
      email: p.email || accountEmail,
    }));

    try {
      setCreatingBooking(true);
      const token = localStorage.getItem("token");
      console.log("[BookingFlow] Creating booking draft:", {
        tripId: trip._id,
        seats: enrichedPassengers.length,
        seatNumbers: activeSeats,
        totalAmount: total,
      });
      console.log("Booking Payload:", {
        tripId: trip._id,
        travellers: enrichedPassengers,
        seats: enrichedPassengers.length,
        seatNumbers: activeSeats,
        totalAmount: total,
        maleCount,
        femaleCount,
        adults: enrichedPassengers.length,
        children: 0,
        pickupLocation: trip.pickupLocation || "",
        contactEmail: accountEmail,
      });

      console.log("[STEP 4] Calling /api/bookings/create-order");
      const bookingRes = await fetch(getApiUrl("bookings/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tripId: trip._id,
          travellers: enrichedPassengers,
          seats: enrichedPassengers.length,
          seatNumbers: activeSeats,
          totalAmount: total,
          maleCount,
          femaleCount,
          adults: enrichedPassengers.length,
          children: 0,
          pickupLocation: trip.pickupLocation || "",
          contactEmail: accountEmail,
          couponCode: couponCode || "",
        }),
      });

      const bookingData = await bookingRes.json();
      console.log("[STEP 5] API Response received:", bookingData);

      if (!bookingRes.ok || !bookingData.success) {
        console.error("[BookingFlow] Booking creation failed:", bookingData);
        throw new Error(bookingData.message || "Failed to create booking on backend.");
      }

      const bookingRef = bookingData.bookingDraftId || bookingData.bookingId;
      const bookingMongoId = bookingData.bookingDraftId || bookingData.booking?._id;

      if (!bookingRef || !bookingMongoId) {
        console.error("[BookingFlow] Invalid booking reference:", bookingData);
        throw new Error("Invalid booking reference returned from server.");
      }

      console.log("[STEP 3] Booking Draft Created - ID:", bookingRef);
      console.log("[BookingFlow] Booking draft created:", { bookingRef, bookingMongoId });
      console.log("Booking Draft Created");

      const bookingObj = {
        bookingId: bookingRef,
        _id: bookingMongoId,
        orderId: bookingData.orderId,
        razorpayKey: bookingData.razorpayKey || bookingData.key,
        tripTitle: trip.title,
        totalAmount: bookingData.amount || total,
        amountPaise: bookingData.amountPaise,  // pass through exact paise from Razorpay order
        startDate: trip.startDate,
        pickupLocation: trip.pickupLocation || "",
      };

      setConfirmedBooking(bookingObj);
      setBookingDraftCreated(true);
      setPassengerSaved(true);
      setPassengerCompleted(true);
      setBookingStage("upi_payment");
      console.log("Launching Razorpay");
      console.log("Payment Started");
    } catch (err) {
      console.error("[Booking Creation Error]:", err);
      toast.error(err.message || "Failed to create booking. Please try again.");
      // Return to redeem_code stage (not seat_select) to allow retry without losing passenger/seat data
      setBookingStage("redeem_code");
    } finally {
      setCreatingBooking(false);
    }
  };

  // Release all reserved seats (on payment cancel)
  const releaseSelectedSeats = useCallback(async () => {
    const token = localStorage.getItem("token");
    for (const seatNumber of selectedSeats) {
      try {
        await fetch(getApiUrl("seats/release"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tripId: trip._id, seatNumber }),
        });
      } catch {}
    }
  }, [selectedSeats, trip?._id]);

  // Called after successful payment
  const handlePaymentSuccess = async (bookingId) => {
    // Confirm seats on backend (creates Passenger docs)
    const token = localStorage.getItem("token");
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      try {
        await fetch(getApiUrl("seats/confirm"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            tripId: trip._id,
            seatNumber: passenger.seatNumber,
            bookingId: confirmedBooking?.bookingId || bookingId,
            passengerData: passenger,
          }),
        });
      } catch {}
    }

    toast.success("Booking confirmed! Your QR ticket is ready.");
    navigate(`/booking-success/${confirmedBooking?.bookingId || bookingId}`);
  };

  const handleCancelBooking = async () => {
    await releaseSelectedSeats();
    setSeatSelected(false);
    setPassengerSaved(false);
    setPassengerCompleted(false);
    setBookingDraftCreated(false);
    setPaymentStarted(false);
    setPaymentCompleted(false);
    setConfirmedBooking(null);
    setPassengers([]);
    setSelectedSeats([]);
    setAppliedCouponCode("");
    setShowBookingModal(false);
    toast.info("Booking cancelled. Seats have been released.");
  };

  const handleCancelPayment = async () => {
    const token = localStorage.getItem("token");
    const targetBookingId = confirmedBooking?._id || confirmedBooking?.bookingId;
    if (targetBookingId) {
      try {
        await fetch(getApiUrl("bookings/cancel"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ bookingId: targetBookingId })
        });
      } catch (err) {
        console.error("[BookingFlow] Failed to cancel draft booking:", err);
      }
    }

    setBookingDraftCreated(false);
    setConfirmedBooking(null);
    setPaymentStarted(false);
    setBookingStage("confirm");
    toast.info("Payment cancelled. You can retry payment.");
  };

  // Allow user to explicitly re-edit passenger details
  const handleEditPassenger = () => {
    setPassengerSaved(false);
    setPassengerCompleted(false);
    setBookingDraftCreated(false);
    setConfirmedBooking(null);
    setBookingStage("seat_select");
    setShowBookingModal(true);
  };

  const handleProceedToPayment = async () => {
    console.log("[STEP 1] Button Click (TripDetails bottom-bar Proceed to Payment)");
    console.log("[STEP 1] State:", { passengerSaved, passengerCompleted, confirmedBooking: !!confirmedBooking, passengers: passengers.length, selectedSeats: selectedSeats.length, bookingDraftCreated });

    // Case 1: Booking draft was already created and confirmedBooking exists
    // → Resume the UPI payment modal directly
    if (bookingDraftCreated && confirmedBooking) {
      console.log("[STEP 2] Draft already created — resuming UPI payment modal.");
      setBookingStage("upi_payment");
      setShowBookingModal(true);
      return;
    }

    // Case 2: Passengers have been verified and seats selected, but draft not yet created
    // → Create the booking draft + Razorpay order immediately
    if (passengerCompleted && passengers.length > 0 && selectedSeats.length > 0) {
      console.log("[STEP 2] Validation Passed: Proceeding to create Razorpay order from passenger data.");

      // Ensure the Razorpay SDK is loaded before we need it
      if (!window.Razorpay) {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
            document.head.appendChild(script);
          });
        } catch (sdkErr) {
          toast.error("Could not load payment gateway. Please check your internet connection.");
          return;
        }
      }

      setShowBookingModal(true);
      await handlePassengersConfirmed(passengers, selectedSeats, appliedCouponCode || "");
      return;
    }

    // Case 3: Passenger form filled but no seats selected — restart from count selection
    if (passengerSaved && selectedSeats.length === 0) {
      console.log("[STEP 2] Passenger saved but no seats — restarting from count select.");
      setBookingStage("count_select");
      setShowBookingModal(true);
      return;
    }

    // Case 4: Nothing filled yet — open fresh booking (seat selection first)
    console.log("[STEP 2] Fresh booking — opening seat selection.");
    handleOpenBooking();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !contactNumber.trim() ||
      !age ||
      !email.trim() ||
      !emergencyContact.trim() ||
      !address.trim() ||
      !pickupLocation.trim()
    ) {
      toast.error("Please fill in all traveler information.");
      return;
    }
    if (totalBookingSeats > trip.availableSeats) {
      toast.error(`Only ${trip.availableSeats} seats left on this trip!`);
      return;
    }

    // Validate additional travelers details
    for (let i = 0; i < additionalTravellers.length; i++) {
      const trav = additionalTravellers[i];
      if (!trav.name.trim() || !trav.age || !trav.gender) {
        toast.error(`Please fill in details for Traveller ${i + 2}`);
        return;
      }
    }

    setSelectedSeats([]); // Reset seat choices
    setBookingStage("seats");
  };

  const handleSeatClick = (seatNum) => {
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatNum));
    } else {
      if (selectedSeats.length >= totalBookingSeats) {
        toast.error(`You can only select ${totalBookingSeats} seats.`);
        return;
      }
      setSelectedSeats(prev => [...prev, seatNum]);
    }
  };

  const handleSeatsSubmit = () => {
    if (selectedSeats.length !== totalBookingSeats) {
      toast.error(`Please select exactly ${totalBookingSeats} seats.`);
      return;
    }

    // Build final travellers list
    const primaryTraveller = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      age: Number(age),
      gender,
      phone: contactNumber,
    };

    const travellers = [
      primaryTraveller,
      ...additionalTravellers.map(t => ({
        name: t.name.trim(),
        age: Number(t.age),
        gender: t.gender,
        phone: t.phone || "",
      })),
    ];

    const basePrice = trip.offerPrice || trip.pricePerPerson || 0;
    const childPrice = Math.round(basePrice * 0.5); // 50% discount for kids
    const adultsSubtotal = adults * basePrice;
    const childrenSubtotal = children * childPrice;
    const subtotal = adultsSubtotal + childrenSubtotal;
    const tax = Math.round(subtotal * 0.05);
    const convenienceFee = 150;
    
    let referralDiscountAmount = 0;
    if (referralInfo.isEligibleForDiscount) {
      referralDiscountAmount = Math.round(subtotal * (referralInfo.referralDiscountPercent / 100));
    }
    const grandTotal = subtotal - referralDiscountAmount + tax + convenienceFee;

    const maleCount = travellers.filter(t => t.gender === "Male").length;
    const femaleCount = travellers.filter(t => t.gender === "Female").length;

    setBookingDetails({
      tripId: trip._id,
      travellers,
      maleCount,
      femaleCount,
      adults,
      children,
      pickupLocation,
      specialRequests,
      selectedSeats,
      basePrice,
      childPrice,
      adultsSubtotal,
      childrenSubtotal,
      subtotal,
      tax,
      convenienceFee,
      pricePaid: grandTotal,
      referralApplied: referralInfo.isEligibleForDiscount,
      referralCode: referralInfo.referredBy,
      referralDiscountPercent: referralInfo.referralDiscountPercent,
      referralDiscountAmount: referralDiscountAmount,
    });

    setBookingStage("confirm");
  };

  const handleConfirmBooking = async () => {
    const activeSeats = bookingDetails?.selectedSeats;
    const travellers = bookingDetails?.travellers;
    const token = localStorage.getItem("token");
    const amount = bookingDetails?.pricePaid;

    if (!token) {
      toast.error("User session expired. Please log in again to book.");
      navigate("/login");
      return;
    }
    if (!activeSeats || activeSeats.length === 0) {
      toast.error("No seats selected. Please select your seat(s) first.");
      setBookingStage("seats");
      return;
    }
    if (!travellers || travellers.length === 0) {
      toast.error("Passenger details are missing.");
      setBookingStage("form");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Invalid booking amount.");
      setBookingStage("confirm");
      return;
    }

    if (paymentOpenedRef.current) {
      console.warn("[Razorpay] Checkout already opened.");
      return;
    }
    paymentOpenedRef.current = true;
    setBookingStage("payment"); // Show "Connecting payment gateway..." loader

    try {
      // 1. Create Booking Draft and Razorpay Order on Backend
      const orderRes = await fetch(getApiUrl("bookings/create-order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tripId: trip._id,
          travellers: travellers,
          seatNumbers: activeSeats,
          totalAmount: amount,
          pickupLocation: bookingDetails.pickupLocation || trip.pickupLocation || "",
          couponCode: selectedCoupon,
          maleCount: bookingDetails.maleCount,
          femaleCount: bookingDetails.femaleCount,
          adults: bookingDetails.adults,
          children: bookingDetails.children,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        paymentOpenedRef.current = false;
        toast.error(orderData.message || "Failed to initiate payment");
        setBookingStage("confirm");
        return;
      }

      // 2. Configure and Open Razorpay Checkout Dialog
      const checkoutAmountPaise = orderData.amountPaise || (orderData.amount * 100);
      
      // Before opening Razorpay, log:
      console.log("[Razorpay Checkout Init Config]:", {
        key: orderData.razorpayKey || "rzp_test_dummykeyid",
        order_id: orderData.orderId,
        amount: checkoutAmountPaise,
        currency: orderData.currency || "INR"
      });

      const options = {
        key: orderData.razorpayKey || "rzp_test_dummykeyid",
        amount: checkoutAmountPaise, // paise
        currency: orderData.currency || "INR",
        name: "Travelloop",
        description: trip.title,
        order_id: orderData.orderId,
        handler: async (response) => {
          // After payment success, log:
          console.log("[Razorpay Success Response]:", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          setBookingStage("payment"); // Show loader during signature verification
          try {
            // 3. Verify Payment on Backend
            const verifyRes = await fetch(getApiUrl("payment/verify"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: orderData.bookingDraftId,
              }),
            });

            const verifyData = await verifyRes.json();
            paymentOpenedRef.current = false;
            if (verifyData.success) {
              setBookingDetails(prev => ({
                ...prev,
                bookingId: verifyData.bookingId || verifyData.booking?.bookingId,
              }));
              toast.success("Booking successfully confirmed!");
              navigate(`/booking/${verifyData.bookingId || verifyData.booking?.bookingId || orderData.bookingDraftId}/success`);
            } else {
              toast.error(verifyData.message || "Payment verification failed");
              setBookingStage("failure");
            }
          } catch (err) {
            paymentOpenedRef.current = false;
            toast.error("Verification error. Please contact support.");
            setBookingStage("failure");
          }
        },
        prefill: {
          name: travellers[0]?.name || `${firstName} ${lastName}`,
          email: travellers[0]?.email || email,
          contact: travellers[0]?.phone || contactNumber,
        },
        theme: {
          color: "#14B8A6", // teal-500
        },
        modal: {
          ondismiss: () => {
            paymentOpenedRef.current = false;
            toast.info("Payment cancelled. You can continue later.");
            setBookingStage("confirm");
          },
        },
      };

      console.log("[Razorpay Checkout Init] Using Key:", options.key);
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        paymentOpenedRef.current = false;
        console.error("[Razorpay Checkout Failed Callback]:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setBookingStage("failure");
      });
      rzp.open();
    } catch (err) {
      paymentOpenedRef.current = false;
      console.error("[Razorpay Checkout Error]:", err);
      toast.error(`Failed to connect to checkout gateway: ${err.message || err}`);
      setBookingStage("confirm");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading trip details...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !trip) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800">{error || "Trip Details Unreachable"}</h2>
          <button
            onClick={() => navigate("/activities")}
            className="px-6 py-2.5 rounded-xl bg-teal-500 text-white font-bold text-xs"
          >
            Back to Explore
          </button>
        </div>
      </MainLayout>
    );
  }

  // Derive stats
  const discountAmount = (trip.originalPrice || 0) - (trip.offerPrice || trip.pricePerPerson || 0);

  return (
    <MainLayout>
      <div className={`pb-[180px] animate-fade-in relative ${showBookingModal ? "z-[10000]" : ""}`}>
        {/* Cover Image & Header Hero */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <img
            src={coverImageUrl}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          {/* Back button */}
          <button
            onClick={() => navigate("/activities")}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform z-10"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

          {/* Header Title Information */}
          <div className="absolute bottom-4 inset-x-0 px-4 text-white">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-teal-500 text-[9px] font-extrabold uppercase tracking-wide">
                {trip.category || "Group Tour"}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/20 text-[9px] font-extrabold uppercase tracking-wide backdrop-blur-xs">
                {trip.duration}
              </span>
            </div>
            <h1 className="text-xl font-black leading-tight drop-shadow-md">{trip.title}</h1>
            {trip.subtitle && <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{trip.subtitle}</p>}
          </div>
        </div>

        {/* Main 3-Column Responsive Grid Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column — Detailed Content (2 Columns on Desktop) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Booking Deadline Warning Banner */}
              {trip.bookingDeadline && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                  isDeadlinePassed
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 text-rose-600 dark:text-rose-400"
                    : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 text-amber-600 dark:text-amber-400"
                }`}>
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">
                      {isDeadlinePassed ? "Bookings Closed" : "Limited Time Booking"}
                    </p>
                    <p className="text-[11px] font-bold mt-0.5 opacity-90">
                      {isDeadlinePassed
                        ? "The booking deadline for this trip has passed. You can no longer book slots."
                        : `Booking Closes in: ${bookingDeadlineFormatted}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Seats Left</span>
                  <span className={`text-sm font-extrabold block mt-0.5 ${trip.availableSeats < 5 ? "text-rose-500 animate-pulse" : "text-slate-700 dark:text-slate-200"}`}>
                    {trip.availableSeats} Left
                  </span>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-750">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Origin</span>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5 truncate">
                    {trip.originCity || "Varies"}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rating</span>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    4.8
                  </span>
                </div>
              </div>

              {/* Agency / Agent Information Section */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3">
                {trip.agent?.profileImage ? (
                  <img
                    src={trip.agent.profileImage}
                    alt="Agent"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-500 font-black flex items-center justify-center text-lg">
                    {(trip.agent?.companyName || "A")[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                      {trip.agent?.companyName || "Verified Partner Agent"}
                    </h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Host Contact: {trip.agent?.phone || "Private Contact"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">About the Journey</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  {trip.description || "No description available for this trip."}
                </p>
              </div>

              {/* Pickup & Drop Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pickup Point</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-2">
                    {pickupPoint || "Pickup details unavailable."}
                  </p>
                  {trip.pickupMapsLink && (
                    <a
                      href={trip.pickupMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold text-teal-600 dark:text-teal-300"
                    >
                      View Pickup Map
                    </a>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Drop Point</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-2">
                    {dropPoint || "Drop details unavailable."}
                  </p>
                  {trip.dropMapsLink && (
                    <a
                      href={trip.dropMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold text-teal-600 dark:text-teal-300"
                    >
                      View Drop Map
                    </a>
                  )}
                </div>
              </div>

              {/* Vehicle & Crew Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Vehicle & Crew Information</h3>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{trip.busType}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Registration: {trip.busNumber}</p>
                    </div>
                  </div>

                  {trip.driverName && (
                    <div className="flex items-center gap-3 border-t border-slate-50 dark:border-slate-750 pt-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Driver: {trip.driverName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Contact: {trip.driverPhone || "Provided on departure"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Destinations Multi-stop timeline */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Travel Route & Destinations</h3>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {trip.destinations?.map((dest, i) => (
                      <React.Fragment key={i}>
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-350 flex-shrink-0">
                          <MapPin size={11} className="text-teal-500" />
                          {dest}
                        </div>
                        {i < (trip.destinations?.length || 0) - 1 && (
                          <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Inclusions</h3>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-2 min-h-[120px]">
                    {(trip.includedServices || []).length > 0 ? (
                      (trip.includedServices || []).map((service, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {service}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Basic amenities included.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Exclusions</h3>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-2 min-h-[120px]">
                    {(trip.excludedServices || []).length > 0 ? (
                      (trip.excludedServices || []).map((service, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                          {service}
                        </div>
                      ))
                    ) : trip.exclusions ? (
                      <p className="text-xs text-slate-500 leading-relaxed">{trip.exclusions}</p>
                    ) : (
                      <p className="text-xs text-slate-400">Personal shopping, entry permits.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Daily Travel Plan</h3>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-4">
                  {itineraryItems.length > 0 ? (
                    itineraryItems.map((day, idx) => {
                      const hasNewFields = day.startLocation || day.destination;
                      const dayTitle = day.title || (hasNewFields ? `${day.startLocation} to ${day.destination}` : `Day ${day.day}`);
                      
                      return (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs border border-teal-200/50">
                              D{day.day}
                            </div>
                            {idx < (trip.itinerary || []).length - 1 && (
                              <div className="w-0.5 bg-slate-100 dark:bg-slate-850 flex-1 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4 space-y-2">
                            <div>
                              <div className="flex items-center justify-between flex-wrap gap-1.5">
                                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{dayTitle}</h4>
                                {day.date && (
                                  <span className="text-[10px] text-slate-400 font-semibold">{day.date}</span>
                                )}
                              </div>
                              
                              {hasNewFields && (day.departureTime || day.arrivalTime || day.duration) && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                                  {day.departureTime && `Departs: ${day.departureTime}`}
                                  {day.arrivalTime && ` | Arrives: ${day.arrivalTime}`}
                                  {day.duration && ` (${day.duration})`}
                                </p>
                              )}
                            </div>

                            {day.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{day.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-550 dark:text-slate-450 text-center py-4">
                      No itinerary available for this trip.
                    </div>
                  )}
                </div>
              </div>

              {/* Hotels / Stays Details */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Hotel & Accommodation Stays</h3>
                {hotelItems.length > 0 ? (
                  <div className="space-y-4">
                    {hotelItems.map((hotel, hIdx) => (
                      <div key={hIdx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3.5 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{hotel.name}</h4>
                              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-[9px] font-extrabold text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/50">
                                {hotel.category || "3 Star"}
                              </span>
                            </div>
                            {hotel.address && (
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 line-clamp-1">{hotel.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-450 text-center">
                    No hotels configured for this trip.
                  </div>
                )}
              </div>

              {/* Featured Activities */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Featured Activities</h3>
                {activityItems.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-wrap gap-2">
                    {activityItems.map((act, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/30 dark:border-teal-900/30 text-xs font-bold text-teal-600 dark:text-teal-400">
                        {act}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-450 text-center">
                    No activities configured for this trip.
                  </div>
                )}
              </div>

              {/* Packing Checklist */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Packing & Checklist Planner</h3>
                {packingItems.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Prepare for your journey</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {packingItems.map((item, idx) => (
                        <PackingChecklistItem key={idx} item={item} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-450 text-center">
                    No packing list available for this trip.
                  </div>
                )}
              </div>

              {/* Policies & Guidelines */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Policies & Guidelines</h3>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-450 leading-relaxed">
                  {trip.termsConditions && (
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-350 mb-1 flex items-center gap-1.5">
                        <Info size={13} className="text-teal-500" /> Terms & Conditions
                      </h4>
                      <p>{trip.termsConditions}</p>
                    </div>
                  )}
                  {trip.cancellationPolicy && (
                    <div className="border-t border-slate-50 dark:border-slate-750 pt-3">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-350 mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-rose-450" /> Cancellation Policy
                      </h4>
                      <p>{trip.cancellationPolicy}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column — Desktop Sticky Booking Sidebar Card */}
            <div className="lg:col-span-1 hidden lg:block sticky top-24 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
                {/* Pricing Header */}
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Price per traveller</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      ₹{new Intl.NumberFormat('en-IN').format(trip.offerPrice || trip.pricePerPerson || 0)}
                    </span>
                    {trip.originalPrice > 0 && (
                      <span className="text-sm text-slate-400 line-through font-semibold">
                        ₹{new Intl.NumberFormat('en-IN').format(trip.originalPrice)}
                      </span>
                    )}
                  </div>
                  {discountAmount > 0 && (
                    <span className="inline-block mt-2 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/50">
                      SAVE ₹{new Intl.NumberFormat('en-IN').format(discountAmount)} INCLUDED
                    </span>
                  )}
                </div>

                {/* Status & Seats Info */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-bold">
                    <span>Available Seats</span>
                    <span className={`font-black ${trip.availableSeats < 5 ? "text-rose-500 animate-pulse" : "text-teal-600 dark:text-teal-400"}`}>
                      🔥 {trip.availableSeats ?? trip.totalSeats} Left
                    </span>
                  </div>
                  {trip.bookingDeadline && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-bold">
                      <span>Deadline</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        {isDeadlinePassed ? "Closed" : bookingDeadlineFormatted}
                      </span>
                    </div>
                  )}
                </div>

                {/* Desktop Book CTA */}
                {isDeadlinePassed ? (
                  <button
                    disabled
                    className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-extrabold text-sm cursor-not-allowed border border-rose-100 dark:border-rose-900/30"
                  >
                    Bookings Closed
                  </button>
                ) : trip.availableSeats <= 0 ? (
                  <button
                    disabled
                    className="w-full py-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-extrabold text-sm cursor-not-allowed"
                  >
                    Trip Sold Out
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenBooking}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white font-black text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Book Now</span>
                    <ArrowRight size={16} />
                  </motion.button>
                )}

                {/* Guarantees List */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
                    <span>Verified Agent & Licensed Operator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-teal-500 shrink-0" />
                    <span>Instant Booking Confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-500 shrink-0" />
                    <span>Best Price Guarantee</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Bottom Booking Sticky Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shadow-xl flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                ₹{new Intl.NumberFormat('en-IN').format(trip.offerPrice || trip.pricePerPerson || 0)}
              </span>
              {trip.originalPrice > 0 && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  ₹{new Intl.NumberFormat('en-IN').format(trip.originalPrice)}
                </span>
              )}
            </div>
            {discountAmount > 0 ? (
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-200/50">
                SAVE ₹{new Intl.NumberFormat('en-IN').format(discountAmount)}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 block font-bold">
                🔥 {trip.availableSeats ?? trip.totalSeats} seats left
              </span>
            )}
          </div>

          {isDeadlinePassed ? (
            <button
              disabled
              className="px-6 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-extrabold text-xs cursor-not-allowed border border-rose-100 dark:border-rose-900/30"
            >
              Bookings Closed
            </button>
          ) : trip.availableSeats <= 0 ? (
            <button
              disabled
              className="px-6 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-extrabold text-xs cursor-not-allowed"
            >
              Trip Sold Out
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenBooking}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white font-extrabold text-xs shadow-lg shadow-teal-500/25 active:scale-98 transition-all flex items-center gap-2"
            >
              <span>Book Now</span>
              <ArrowRight size={15} />
            </motion.button>
          )}
        </div>
        {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
            NEW BOOKING FLOW: Seat Select â Passenger Form â UPI â Ticket
            âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
        <AnimatePresence>
          {showBookingModal && bookingStage === "count_select" && trip && (
            <PassengerCountModal
              trip={trip}
              onConfirm={handleCountConfirmed}
              onClose={() => { setShowBookingModal(false); }}
            />
          )}

          {showBookingModal && bookingStage === "seat_select" && trip && (
            <SeatLayoutModal
              trip={trip}
              requiredSeats={passengerCount || 1}
              initialSelected={selectedSeats}
              initialPassengerDetails={(() => {
                const obj = {};
                passengers.forEach(p => {
                  if (p.seatNumber) {
                    obj[p.seatNumber] = {
                      seatNumber: p.seatNumber,
                      name: p.name || p.passengerName,
                      age: p.age,
                      gender: p.gender,
                      bookingForOthers: p.bookingForOthers,
                      travelerPhone: p.travelerPhone || p.phone || p.contactPhone,
                      travelerPhoneVerified: p.travelerPhoneVerified || p.phoneVerified,
                      verifiedAt: p.verifiedAt,
                    };
                  }
                });
                return obj;
              })()}
              onConfirm={(seats, passengersList) => {
                // CRITICAL: Pass seats explicitly as second arg to bypass React state lag.
                // setSelectedSeatsList is async; selectedSeats would still be [] on next line.
                handleSeatsConfirmed(seats, passengersList);
              }}
              onClose={() => { setShowBookingModal(false); }}
            />
          )}

          {/* PassengerFormModal only shows if SeatLayoutModal did NOT collect passenger data */}
          {showBookingModal && bookingStage === "passenger_form" && trip && !passengerCompleted && (
            <PassengerFormModal
              selectedSeats={selectedSeats}
              trip={trip}
              onConfirm={(passengerList) => {
                setPassengerSaved(true);
                setPassengerCompleted(true);
                setPassengers(passengerList);
                setBookingStage("redeem_code");
              }}
              onBack={() => setBookingStage("seat_select")}
              onClose={() => { releaseSelectedSeats(); setShowBookingModal(false); }}
            />
          )}

          {showBookingModal && bookingStage === "redeem_code" && (
            <RedeemCodeModal
              trip={trip}
              passengers={passengers}
              onClose={() => {
                releaseSelectedSeats();
                setShowBookingModal(false);
              }}
              onConfirm={async (couponCode, discountAmount, finalTotal) => {
                setAppliedCouponCode(couponCode);
                await handlePassengersConfirmed(passengers, selectedSeats, couponCode);
              }}
            />
          )}

          {showBookingModal && bookingStage === "upi_payment" && confirmedBooking && (
            <UPIPaymentModal
              booking={confirmedBooking}
              passengers={passengers}
              trip={trip}
              couponCode={appliedCouponCode}
              onSuccess={handlePaymentSuccess}
              onCancel={handleCancelBooking}
              onClose={() => { setShowBookingModal(false); }}
              onEditBooking={handleEditPassenger}
              onPaymentStarted={() => setPaymentStarted(true)}
            />
          )}

          {showBookingModal && bookingStage === "ticket" && ticketData && (
            <TicketModal
              bookingSummary={ticketData?.booking || confirmedBooking}
              passengers={ticketData?.passengers || passengers}
              trip={trip}
              onClose={() => {
                setShowBookingModal(false);
                navigate("/my-trips");
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
};
export default TripDetails;