// src/pages/TripDetails.jsx — Published Group Trip Details & Booking Flow
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, Calendar, Users, Compass,
  CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert,
  ChevronRight, Phone, Mail, Award, Info, Heart, CreditCard, Sparkles, Navigation, X, Clock, Eye, Loader2
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";

export const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isDeadlinePassed = trip && trip.bookingDeadline ? new Date() > new Date(trip.bookingDeadline) : false;
  const bookingDeadlineFormatted = trip && trip.bookingDeadline ? new Date(trip.bookingDeadline).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "";

  // Booking Flow States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStage, setBookingStage] = useState("form"); // "form" | "seats" | "confirm" | "payment" | "success"
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);

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
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Additional travelers
  const [additionalTravellers, setAdditionalTravellers] = useState([]);

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
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(getApiUrl(`trips/published/${id}`), { headers });
        const data = await res.json();
        if (data.success && data.trip) {
          setTrip(data.trip);
          setBookedSeats(data.bookedSeatNumbers || []);
          if (data.trip.pickupLocation) {
            setPickupLocation(data.trip.pickupLocation);
          }
        } else {
          setError(data.message || "Failed to load trip details");
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

  const handleOpenBooking = () => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to book this trip.");
      navigate("/login");
      return;
    }
    setBookingStage("form");
    setShowBookingModal(true);
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
    const grandTotal = subtotal + tax + convenienceFee;

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
    });

    setBookingStage("confirm");
  };

  const handleConfirmBooking = async () => {
    setBookingStage("payment"); // Show "Connecting payment gateway..." loader

    try {
      const token = localStorage.getItem("token");
      
      // 1. Create Razorpay Order on Backend
      const orderRes = await fetch(getApiUrl("payment/create-order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tripId: bookingDetails.tripId,
          seats: bookingDetails.travellers.length,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        toast.error(orderData.message || "Failed to initiate payment");
        setBookingStage("confirm");
        return;
      }

      // 2. Configure and Open Razorpay Checkout Dialog
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
        amount: orderData.amount * 100, // paise
        currency: orderData.currency || "INR",
        name: "Traveloop",
        description: trip.title,
        order_id: orderData.orderId,
        handler: async (response) => {
          setBookingStage("payment"); // Show loader during signature verification
          try {
            // 3. Verify Payment and Store Booking on Backend
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
                bookingId: bookingDetails?.bookingId,
                bookingPayload: {
                  tripId: bookingDetails.tripId,
                  maleCount: bookingDetails.maleCount,
                  femaleCount: bookingDetails.femaleCount,
                  adults: bookingDetails.adults,
                  children: bookingDetails.children,
                  travellers: bookingDetails.travellers,
                  pickupLocation: bookingDetails.pickupLocation,
                  totalAmount: bookingDetails.pricePaid,
                  seatNumbers: bookingDetails.selectedSeats,
                },
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setBookingDetails(prev => ({
                ...prev,
                bookingId: verifyData.bookingId || verifyData.booking?.bookingId,
              }));
              setBookingStage("success");
              toast.success("Booking successfully confirmed!");
            } else {
              toast.error(verifyData.message || "Payment verification failed");
              setBookingStage("failure");
            }
          } catch (err) {
            toast.error("Verification error. Please contact support.");
            setBookingStage("failure");
          }
        },
        prefill: {
          name: `${firstName} ${lastName}`,
          email: email,
          contact: contactNumber,
        },
        theme: {
          color: "#14B8A6", // teal-500
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
            setBookingStage("confirm");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("[Razorpay Checkout Error]:", err);
      toast.error("Failed to connect to checkout gateway.");
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
            src={trip.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"}
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

        {/* Contents Grid */}
        <div className="px-4 mt-6 space-y-6">
          
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
              {trip.description}
            </p>
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
                    {i < trip.destinations.length - 1 && (
                      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Bus & Driver Details */}
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
          {(trip.itinerary || []).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Daily Travel Plan</h3>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-4">
                {(trip.itinerary || []).map((day, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs border border-teal-200/50">
                        D{day.day}
                      </div>
                      {idx < (trip.itinerary || []).length - 1 && (
                        <div className="w-0.5 bg-slate-100 dark:bg-slate-850 flex-1 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{day.title}</h4>
                      <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 leading-relaxed">{day.description}</p>
                      {day.hotel && (
                        <div className="text-[10px] text-teal-600 font-bold bg-teal-50/40 dark:bg-teal-900/20 px-2 py-0.5 rounded mt-2 w-max border border-teal-100 dark:border-teal-900/50">
                          🏨 Stay: {day.hotel}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms & Policies */}
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

        {/* Bottom Booking Sticky Bar */}
        <div className="fixed bottom-[90px] left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border border-slate-250 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 z-[9999] shadow-2xl pointer-events-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-teal-600 dark:text-teal-400">
                ₹{(trip.offerPrice || trip.pricePerPerson || 0).toLocaleString()}
              </span>
              {trip.originalPrice > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{trip.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {discountAmount > 0 && (
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-200">
                Save ₹{discountAmount.toLocaleString()}
              </span>
            )}
          </div>

          {isDeadlinePassed ? (
            <button
              disabled
              className="px-8 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-450 font-extrabold text-xs cursor-not-allowed border border-rose-100 dark:border-rose-900/30"
            >
              Bookings Closed
            </button>
          ) : trip.availableSeats <= 0 ? (
            <button
              disabled
              className="px-8 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-extrabold text-xs cursor-not-allowed"
            >
              Trip Sold Out
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenBooking}
              className="px-8 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs shadow-md shadow-teal-500/20 active:scale-98 transition-all"
            >
              Book Now
            </motion.button>
          )}
        </div>

        {/* ─── BOOKING MODAL SHEET ─── */}
        <AnimatePresence>
          {showBookingModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (bookingStage === "form" || bookingStage === "success") {
                    setShowBookingModal(false);
                  }
                }}
                className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs"
              />

              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 inset-x-0 z-[10001] bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-100 dark:border-slate-800"
              >
                {bookingStage === "form" ? (
                  <form onSubmit={handleFormSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden w-full">
                    {/* Header */}
                    <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-850 shrink-0 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-855 dark:text-white">Secure Group Booking</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Provide traveler information</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBookingModal(false)}
                        className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-[220px]">
                      {/* Primary Passenger details */}
                      <div className="text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-wider">
                        Primary Passenger details
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">First Name</label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Last Name</label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Age</label>
                          <input
                            type="number"
                            required
                            min="5"
                            max="120"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Years"
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            placeholder="Mobile"
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emergency Contact</label>
                          <input
                            type="tel"
                            required
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            placeholder="Emergency Mobile"
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pickup Location</label>
                          <input
                            type="text"
                            required
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            placeholder="Boarding Point"
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Address</label>
                        <textarea
                          rows={2}
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Your residential address"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Special Requests (Optional)</label>
                        <input
                          type="text"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder="Wheelchair access, food preferences..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                        />
                      </div>

                      {/* Travel details stats */}
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Adults Count</label>
                          <select
                            value={adults}
                            onChange={(e) => setAdults(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Children Count</label>
                          <select
                            value={children}
                            onChange={(e) => setChildren(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                          >
                            {[0, 1, 2, 3, 4, 5].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Dynamic additional travelers details */}
                      {additionalTravellers.map((traveller, index) => (
                        <div key={index} className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-3">
                          <div className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider">
                            Passenger {index + 2} Details
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                            <input
                              type="text"
                              required
                              value={traveller.name}
                              onChange={(e) => {
                                const next = [...additionalTravellers];
                                next[index].name = e.target.value;
                                setAdditionalTravellers(next);
                              }}
                              placeholder="Name"
                              className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Age</label>
                              <input
                                type="number"
                                required
                                min="1"
                                max="120"
                                value={traveller.age}
                                onChange={(e) => {
                                  const next = [...additionalTravellers];
                                  next[index].age = e.target.value;
                                  setAdditionalTravellers(next);
                                }}
                                placeholder="Years"
                                className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
                              <select
                                value={traveller.gender}
                                onChange={(e) => {
                                  const next = [...additionalTravellers];
                                  next[index].gender = e.target.value;
                                  setAdditionalTravellers(next);
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:border-teal-400"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fixed Footer */}
                    <div
                      className="px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shrink-0 space-y-3"
                      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Seats to Book</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{totalBookingSeats} Seats</span>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs shadow-md shadow-teal-500/25 active:scale-98 transition-all"
                      >
                        Proceed to Seat Selection
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col h-full max-h-[90vh] overflow-hidden w-full">
                    {/* Header */}
                    <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-850 shrink-0 flex items-center justify-between">
                      {bookingStage === "seats" && (
                        <div>
                          <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Bus Seat Layout</h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Select {totalBookingSeats} seats ({selectedSeats.length} of {totalBookingSeats} selected)
                          </p>
                        </div>
                      )}
                      {bookingStage === "confirm" && (
                        <div>
                          <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Review Booking & Pricing</h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please check before checkout</p>
                        </div>
                      )}
                      {bookingStage === "payment" && (
                        <div>
                          <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Payment Gateway</h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Processing details</p>
                        </div>
                      )}
                      {bookingStage === "success" && (
                        <div>
                          <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">Booking Confirmed!</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Booking ID: {bookingDetails?.bookingId}</p>
                        </div>
                      )}
                      {bookingStage === "failure" && (
                        <div>
                          <h3 className="text-base font-black text-rose-600 dark:text-rose-400">Payment Failed</h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Transaction was not completed</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (bookingStage === "seats") {
                            setBookingStage("form");
                          } else if (bookingStage === "confirm") {
                            setBookingStage("seats");
                          } else if (bookingStage === "failure") {
                            setBookingStage("confirm");
                          } else {
                            setShowBookingModal(false);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        {bookingStage === "success" || bookingStage === "failure" ? <X size={15} /> : <ArrowLeft size={15} />}
                      </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-[220px]">
                      {bookingStage === "seats" && (
                        <div className="py-2">
                          <div className="flex justify-between items-center max-w-sm mx-auto mb-6 px-4 py-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>[ ] Driver's Cabin</span>
                            <span>Entry Door 🚪</span>
                          </div>

                          <div className="grid grid-cols-5 gap-2.5 max-w-sm mx-auto bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-inner">
                            {Array.from({ length: 10 }).map((_, rowIndex) => {
                              const rowNum = rowIndex + 1;
                              const seatLetters = ["A", "B", "Spacer", "C", "D"];
                              return seatLetters.map((letter) => {
                                if (letter === "Spacer") {
                                  return <div key={`${rowNum}-spacer`} className="flex items-center justify-center text-[10px] font-bold text-slate-300 dark:text-slate-800">Aisle</div>;
                                }
                                const seatNum = `${rowNum}${letter}`;
                                const isBooked = bookedSeats.includes(seatNum);
                                const isSelected = selectedSeats.includes(seatNum);
                                return (
                                  <button
                                    key={seatNum}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => handleSeatClick(seatNum)}
                                    className={`h-10 rounded-xl text-[10px] font-extrabold transition-all border flex flex-col items-center justify-center relative ${
                                      isBooked
                                        ? "bg-slate-200 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                        : isSelected
                                        ? "bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/25 scale-102"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:border-teal-400"
                                    }`}
                                  >
                                    <span>{seatNum}</span>
                                    {isBooked && <span className="text-[7px] text-slate-400 block mt-0.5">Booked</span>}
                                  </button>
                                );
                              });
                            })}
                          </div>
                        </div>
                      )}

                      {bookingStage === "confirm" && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-455">
                            <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Journey Name:</span>
                                <span className="font-extrabold text-slate-800 dark:text-white truncate max-w-[200px]">{trip.title}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Dates:</span>
                                <span className="font-extrabold text-slate-800 dark:text-white">
                                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Bus configuration:</span>
                                <span className="font-extrabold text-slate-800 dark:text-white">{trip.busType || "Volvo AC Sleeper"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Seats Reserved:</span>
                                <span className="font-extrabold text-slate-800 dark:text-white">
                                  {bookingDetails.selectedSeats.join(", ")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Total Travelers:</span>
                                <span className="font-extrabold text-slate-800 dark:text-white">
                                  {bookingDetails.travellers.length} ({bookingDetails.adults} Adults, {bookingDetails.children} Children)
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Offer Price (Per Seat):</span>
                                <span className="font-extrabold text-slate-800 dark:text-white">₹{bookingDetails.basePrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Adults Subtotal:</span>
                                <span className="font-extrabold text-slate-850 dark:text-white">
                                  {bookingDetails.adults} × ₹{bookingDetails.basePrice.toLocaleString()} = ₹{bookingDetails.adultsSubtotal.toLocaleString()}
                                </span>
                              </div>
                              {bookingDetails.children > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Children Subtotal (50% Off):</span>
                                  <span className="font-extrabold text-slate-850 dark:text-white">
                                    {bookingDetails.children} × ₹{bookingDetails.childPrice.toLocaleString()} = ₹{bookingDetails.childrenSubtotal.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-slate-400">Tax & GST (5%):</span>
                                <span className="font-extrabold text-slate-850 dark:text-white">₹{bookingDetails.tax.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Convenience fee:</span>
                                <span className="font-extrabold text-slate-850 dark:text-white">₹{bookingDetails.convenienceFee.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="font-black text-slate-800 dark:text-slate-300">Grand Total Amount:</span>
                              <span className="font-black text-base text-teal-600 dark:text-teal-400">₹{bookingDetails.pricePaid.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {bookingStage === "payment" && (
                        <div className="py-8 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
                          <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500 relative">
                            <div className="w-12 h-12 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-880 dark:text-white animate-pulse">Connecting payment gateway...</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Please do not refresh or hit the back button.</p>
                          </div>
                        </div>
                      )}

                      {bookingStage === "success" && (
                        <div className="py-4 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
                          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center text-2xl border border-emerald-250">
                            🎉
                          </div>
                          <div>
                            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">Booking Confirmed!</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Booking ID: {bookingDetails?.bookingId}</p>
                          </div>

                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 w-full text-xs font-semibold text-slate-605 dark:text-slate-400 text-left space-y-1.5">
                            <p className="flex justify-between"><span>Journey:</span><span className="font-extrabold text-slate-700 dark:text-white">{trip.title}</span></p>
                            <p className="flex justify-between"><span>Primary contact:</span><span className="font-extrabold text-slate-700 dark:text-white">{bookingDetails?.travellers?.[0]?.name}</span></p>
                            <p className="flex justify-between"><span>Reserved seats:</span><span className="font-extrabold text-slate-700 dark:text-white">{bookingDetails?.selectedSeats?.join(", ")}</span></p>
                            <p className="flex justify-between"><span>Paid amount:</span><span className="font-black text-teal-650 dark:text-teal-400">₹{bookingDetails?.pricePaid?.toLocaleString()}</span></p>
                          </div>
                        </div>
                      )}

                      {bookingStage === "failure" && (
                        <div className="py-8 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
                          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center text-2xl border border-rose-250">
                            ✕
                          </div>
                          <div>
                            <h3 className="text-base font-black text-rose-650 dark:text-rose-450">Payment Verification Failed</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">We were unable to verify your payment status.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fixed Footer */}
                    <div
                      className="px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shrink-0"
                      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
                    >
                      {bookingStage === "seats" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setBookingStage("form")}
                            className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold text-xs active:scale-98 transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleSeatsSubmit}
                            disabled={selectedSeats.length !== totalBookingSeats}
                            className={`flex-1 py-3.5 rounded-2xl font-extrabold text-xs active:scale-98 transition-all shadow-md ${
                              selectedSeats.length === totalBookingSeats
                                ? "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                            }`}
                          >
                            Confirm Seats & Pricing
                          </button>
                        </div>
                      )}

                      {bookingStage === "confirm" && (
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase text-[9px]">Seats Selected</span>
                              <span className="font-extrabold text-slate-800 dark:text-white">{bookingDetails?.selectedSeats?.join(", ")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase text-[9px]">Travelers</span>
                              <span className="font-extrabold text-slate-800 dark:text-white">{bookingDetails?.travellers?.length} Total</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-slate-800 dark:text-slate-400">Grand Total:</span>
                            <span className="font-black text-base text-teal-600 dark:text-teal-400">₹{bookingDetails?.pricePaid?.toLocaleString()}</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setBookingStage("seats")}
                              className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-355 font-bold text-xs active:scale-98 transition-all"
                            >
                              Back
                            </button>
                            <button
                              onClick={handleConfirmBooking}
                              className="flex-1 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs shadow-md shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                            >
                              Confirm Booking
                            </button>
                          </div>
                        </div>
                      )}

                      {bookingStage === "success" && (
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              toast.success("Downloading ticket PDF...");
                              window.print();
                            }}
                            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                          >
                            Download Ticket
                          </button>
                          <button
                            onClick={() => {
                              setShowBookingModal(false);
                              navigate("/my-trips");
                            }}
                            className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs shadow-md shadow-teal-500/20 active:scale-98 transition-all"
                          >
                            View My Trips
                          </button>
                          <button
                            onClick={() => {
                              setShowBookingModal(false);
                              navigate("/dashboard");
                            }}
                            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-550 dark:text-slate-400 font-semibold text-xs"
                          >
                            Go Home
                          </button>
                        </div>
                      )}

                      {bookingStage === "failure" && (
                        <div className="space-y-2">
                          <button
                            onClick={handleConfirmBooking}
                            className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs shadow-md shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                          >
                            Retry Payment
                          </button>
                          <button
                            onClick={() => {
                              setBookingStage("confirm");
                            }}
                            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-555 dark:text-slate-400 font-semibold text-xs bg-slate-50 dark:bg-slate-900"
                          >
                            Go Back
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};
export default TripDetails;
