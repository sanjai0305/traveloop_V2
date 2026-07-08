import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth as firebaseAuth } from "../../../traveloop/src/services/firebase";
import {
  Compass,
  Users,
  IndianRupee,
  CalendarDays,
  FileCheck,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Lock,
  AlertTriangle,
  Trash2,
  Plus,
  Eye,
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  FolderOpen,
  Info,
  MapPin,
  Calendar,
  Bus,
  Hotel,
  Coffee,
  BarChart3,
  ShoppingBag,
  User,
  Heart,
  ChevronUp,
  ChevronDown,
  Copy,
  ShieldCheck,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { GlassCard, Button, Input, ImageUploadBox, Modal } from "../components/ui";
import { getMyTrips, createTrip, updateTrip, deleteTrip, saveDraft, publishTrip, getMasterData, createMasterEntry, getAgentSlots } from "../services/tripService";
import { formatCurrency, formatDate } from "../utils";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import socket from "../services/socket";
import { AgentTrip } from "../types";

// ── Extended Trip Form Shape ────────────────────────────────────────────────
interface TripFormData {
  title: string;
  subtitle?: string;
  tagline?: string;
  tripType: string;
  category?: string;
  coverImage?: string;
  coverImages: string[];
  gallery: string[];
  status: string;

  // Step 2 Route
  pickupLocation: string;
  pickupMapsLink: string;
  originCity?: string;
  destinations?: string[];
  intermediateStops?: string[];
  dropPoint?: string;
  dropMapsLink?: string;
  destinationCity?: string;

  // Step 3 Date & Deadline
  startDate: string;
  departureTime: string;
  endDate: string;
  returnTime: string;
  duration: string;
  deadlineEnabled: boolean;
  deadlineDate: string;
  deadlineTime: string;

  // Step 4 Journey Planner
  itinerary: Array<{
    day: number;
    date: string;
    startLocation: string;
    departureTime: string;
    destination: string;
    arrivalTime: string;
    placesCovered: string[];
    activities: string[];
    duration: string;
    hotelName: string;
    nightStay: string;
    notes: string;
    // Compatibility fields
    title?: string;
    description?: string;
    hotel?: string;
    images?: string[];
    activity?: string;
    time?: string;
    lunch?: string;
    stay?: string;
  }>;

  // Step 5 Hotels & Food
  hotels: Array<{
    name: string;
    category: string;
    address: string;
    mapsLink: string;
    photos: string[];
    roomType: string;
    occupancy: number;
    nightStayCount: number;
    notes: string;
  }>;
  foodIncluded: boolean;
  mealsIncluded: string[]; // breakfast, lunch, dinner

  // Step 6 Transport
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  driverGmail: string;
  driverLicenseNumber: string;
  busNumber: string;
  busAmenities?: string[];
  amenities: string[];
  transportImages?: {
    frontImage?: string;
    backImage?: string;
    interiorImages?: string[];
    seatImages?: string[];
  };

  // Step 7 Activities
  activities: string[];

  // Step 8 Packing Checklist
  packingChecklist: string[];

  // Step 9 Pricing
  originalPrice: number;
  offerPrice: number;
  gstPercentage: number;
  convenienceFee: number;
  totalSeats: number;
  cancellationPolicy: string;
  customCancellationPolicy?: string;
}

const TRIP_TYPES = [
  "Group Tour",
  "Family",
  "Couples",
  "Friends",
  "Corporate",
  "Student",
  "Pilgrimage",
  "Adventure",
  "Honeymoon",
  "Custom Tour"
];

const TRIP_CATEGORIES = ["Budget", "Premium", "Luxury"];

const VEHICLE_TYPES = ["Bus", "Tempo Traveller", "Van", "Cab", "Sleeper"];

const BUS_AMENITIES_OPTIONS = [
  "AC", "Non AC", "Charging Port", "Blanket", "WiFi", 
  "Pushback Seat", "Water Bottle", "TV", "Music System", 
  "Emergency Kit", "First Aid", "GPS Tracking"
];

const HOTEL_CATEGORIES = ["3 Star", "4 Star", "5 Star"];
const ROOM_TYPES = ["Double", "Triple", "Family", "Suite"];

const ACTIVITIES_OPTIONS = [
  "Swimming", "Boating", "Temple Visit", "Camping", "Safari", 
  "Shopping", "Adventure Sports", "Photography", "Sightseeing"
];

const DEFAULT_PACKING_ITEMS = [
  "Passport", "ID Card", "Power Bank", "Shoes", "Medicine", 
  "Umbrella", "Jacket", "Camera", "Water Bottle", "Cash"
];

// Multiple Image Upload Utility Component
const MultipleImageUpload: React.FC<{
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder: string;
}> = ({ label, values, onChange, folder }) => {
  const handleAdd = (url: string) => {
    if (url) onChange([...values, url]);
  };
  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };
  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {values.map((url, idx) => (
          <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-24 bg-slate-50">
            <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <div className="h-24">
          <ImageUploadBox
            label=""
            folder={folder}
            value=""
            onChange={handleAdd}
          />
        </div>
      </div>
    </div>
  );
};

export const Trips: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { agent } = useAuthStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(() => sessionStorage.getItem("editingTripId"));
  const [activeTab, setActiveTab] = useState(1);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishModalTrip, setPublishModalTrip] = useState<any>(null);
  const [publishConfirmInput, setPublishConfirmInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missingFieldsAlert, setMissingFieldsAlert] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState("");
  const [newPackingItem, setNewPackingItem] = useState("");

  // Date Change OTP verification modal states
  const [dateOtpModalOpen, setDateOtpModalOpen] = useState(false);
  const [dateOtpCode, setDateOtpCode] = useState("");
  const [dateOtpError, setDateOtpError] = useState("");

  // ── Driver Verification States (Step 6) ────────────────────────────────────
  const [driverMobileVerified, setDriverMobileVerified] = useState(false);
  const [driverMobileVerifiedAt, setDriverMobileVerifiedAt] = useState<Date | null>(null);
  const [driverEmailVerified, setDriverEmailVerified] = useState(false);
  const [driverEmailVerifiedAt, setDriverEmailVerifiedAt] = useState<Date | null>(null);
  // Mobile OTP (Firebase)
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState("");
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileOtpError, setMobileOtpError] = useState("");
  const [mobileResendCooldown, setMobileResendCooldown] = useState(0);
  // Email OTP
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  // Initial driver info to prevent reset when editing
  const [initialDriverPhone, setInitialDriverPhone] = useState("");
  const [initialDriverEmail, setInitialDriverEmail] = useState("");
  // Refs
  const recaptchaVerifierRef = useRef<any>(null);
  const confirmationResultRef = useRef<any>(null);

  // Deletion refund OTP wizard states
  const [deleteWizardOpen, setDeleteWizardOpen] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState<any>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [travelerRefundBookings, setTravelerRefundBookings] = useState<any[]>([]);
  const [travelerOtpInputs, setTravelerOtpInputs] = useState<Record<string, string>>({});
  const [travelerVerifyingMap, setTravelerVerifyingMap] = useState<Record<string, boolean>>({});
  const [agentOtpInput, setAgentOtpInput] = useState("");
  const [deleteWizardError, setDeleteWizardError] = useState("");
  const [deleteWizardSuccess, setDeleteWizardSuccess] = useState("");

  const kycStatus = agent?.kycStatus || "PENDING";
  // Synchronized with backend kycMiddleware: allow KYC_COMPLETED/APPROVED,
  // AND also allow agents with profileCompleted=true + status=approved (admin/seeder created)
  const kycPassed = kycStatus === "KYC_COMPLETED" || kycStatus === "APPROVED";
  const adminApproved = agent?.profileCompleted === true && (agent?.status === "approved" || agent?.status === "APPROVED");
  const isProfileCompleted = kycPassed || adminApproved;


  const { data, isLoading } = useQuery({
    queryKey: ["my-trips"],
    queryFn: getMyTrips,
  });

  const { data: slotData } = useQuery({
    queryKey: ["agent-slots"],
    queryFn: getAgentSlots,
    enabled: isProfileCompleted,
  });

  const trips = (data as any)?.trips || (Array.isArray(data) ? data : []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<TripFormData>({
    mode: "onChange",
    defaultValues: {
      title: "",
      subtitle: "",
      tagline: "",
      tripType: "Group Tour",
      coverImages: [],
      gallery: [],
      status: "draft",
      pickupLocation: "",
      pickupMapsLink: "",
      dropPoint: "",
      dropMapsLink: "",
      destinations: [],
      originCity: "",
      startDate: "",
      departureTime: "",
      endDate: "",
      returnTime: "",
      duration: "",
      deadlineEnabled: false,
      deadlineDate: "",
      deadlineTime: "23:59",
      itinerary: [
        {
          day: 1,
          date: "",
          startLocation: "",
          departureTime: "",
          destination: "",
          arrivalTime: "",
          placesCovered: [],
          activities: [],
          duration: "",
          hotelName: "",
          nightStay: "",
          notes: "",
        }
      ],
      hotels: [],
      foodIncluded: false,
      mealsIncluded: [],
      vehicleType: "Bus",
      driverName: "",
      driverPhone: "",
      driverGmail: "",
      driverLicenseNumber: "",
      busNumber: "",
      amenities: [],
      busAmenities: [],
      activities: [],
      packingChecklist: DEFAULT_PACKING_ITEMS,
      originalPrice: 5000,
      offerPrice: 4500,
      gstPercentage: 5,
      convenienceFee: 150,
      totalSeats: 40,
      cancellationPolicy: "Fully Refundable",
      customCancellationPolicy: ""
    },
  });

  const { fields: itineraryFields, replace: replaceItinerary } = useFieldArray({
    control,
    name: "itinerary",
  });

  const { fields: hotelFields, append: appendHotel, remove: removeHotel } = useFieldArray({
    control,
    name: "hotels",
  });

  // Watch Form Fields
  const watchCoverImages = watch("coverImages") || [];
  const watchGallery = watch("gallery") || [];
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  const watchDeadlineEnabled = watch("deadlineEnabled");
  const watchDeadlineDate = watch("deadlineDate");
  const watchMealsIncluded = watch("mealsIncluded") || [];
  const watchAmenities = watch("amenities") || [];
  const watchActivities = watch("activities") || [];
  const watchPackingChecklist = watch("packingChecklist") || [];
  const watchCancellationPolicy = watch("cancellationPolicy");
  const watchTransportImages = (watch("transportImages") as any) || {};
  const hasBookings = !!(
    editingTripId &&
    trips?.find((t: any) => t._id === editingTripId)?.bookedSeats > 0
  );

  const watchItinerary = watch("itinerary") || [];
  const watchDestinations = watch("destinations") || [];
  const watchOriginCity = watch("originCity") || "";

  // Auto-calculate Duration & sync Itinerary Days based on Start and End Dates
  useEffect(() => {
    if (!watchStartDate || !watchEndDate) {
      return;
    }
    const start = new Date(watchStartDate + "T00:00:00");
    const end = new Date(watchEndDate + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }

    const diffTime = end.getTime() - start.getTime();
    let totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) {
      totalDays = 1;
    }

    const days = totalDays;
    const nights = totalDays;
    const durationStr = `${days} Day${days !== 1 ? "s" : ""} / ${nights} Night${nights !== 1 ? "s" : ""}`;
    
    if (watch("duration") !== durationStr) {
      setValue("duration", durationStr);
    }

    // Sync itinerary field array length
    const currentItinerary = watchItinerary || [];
    let hasChanged = false;
    const nextItinerary = [];

    for (let i = 0; i < totalDays; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      const yyyy = dayDate.getFullYear();
      const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
      const dd = String(dayDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Check if day already exists in currentItinerary
      const existing = currentItinerary[i];
      if (existing) {
        if (existing.date !== dateStr || existing.day !== i + 1) {
          nextItinerary.push({
            ...existing,
            day: i + 1,
            date: dateStr,
          });
          hasChanged = true;
        } else {
          nextItinerary.push(existing);
        }
      } else {
        nextItinerary.push({
          day: i + 1,
          date: dateStr,
          startLocation: "",
          departureTime: "",
          destination: "",
          arrivalTime: "",
          placesCovered: [],
          activities: [],
          duration: "",
          hotelName: "",
          nightStay: "",
          notes: "",
        });
        hasChanged = true;
      }
    }

    if (currentItinerary.length !== totalDays) {
      hasChanged = true;
    }

    if (hasChanged) {
      replaceItinerary(nextItinerary);
    }
  }, [watchStartDate, watchEndDate, setValue, replaceItinerary]);

  // ── Reset driver verification when phone or email changes ─────────────────
  const watchDriverPhone = watch("driverPhone");
  const watchDriverGmail = watch("driverGmail");

  useEffect(() => {
    if (watchDriverPhone !== initialDriverPhone) {
      setDriverMobileVerified(false);
      setDriverMobileVerifiedAt(null);
      setMobileOtpSent(false);
      setMobileOtpInput("");
      setMobileOtpError("");
      confirmationResultRef.current = null;
    }
  }, [watchDriverPhone, initialDriverPhone]);

  useEffect(() => {
    if (watchDriverGmail !== initialDriverEmail) {
      setDriverEmailVerified(false);
      setDriverEmailVerifiedAt(null);
      setEmailOtpSent(false);
      setEmailOtpInput("");
      setEmailOtpError("");
    }
  }, [watchDriverGmail, initialDriverEmail]);

  // ── Mobile cooldown timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (mobileResendCooldown <= 0) return;
    const timer = setTimeout(() => setMobileResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [mobileResendCooldown]);

  // ── Email cooldown timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const timer = setTimeout(() => setEmailResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailResendCooldown]);

  // ── Driver Verification Handlers ───────────────────────────────────────────
  const sendDriverMobileOtp = async () => {
    const phone = watch("driverPhone");
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      setMobileOtpError("Please enter a valid 10-digit driver mobile number first");
      return;
    }
    setMobileOtpError("");
    setMobileOtpLoading(true);
    try {
      // Clean up previous verifier
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        firebaseAuth,
        "driver-recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("[Driver reCAPTCHA] Solved"),
          "expired-callback": () => console.log("[Driver reCAPTCHA] Expired"),
        }
      );
      const formattedPhone = `+91${phone}`;
      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth,
        formattedPhone,
        recaptchaVerifierRef.current
      );
      confirmationResultRef.current = confirmationResult;
      setMobileOtpSent(true);
      setMobileResendCooldown(60);
    } catch (err: any) {
      console.error("[Driver Mobile OTP] Firebase error:", err);
      setMobileOtpError(err.message || "Failed to send OTP. Please try again.");
      recaptchaVerifierRef.current = null;
    } finally {
      setMobileOtpLoading(false);
    }
  };

  const verifyDriverMobileOtp = async () => {
    if (!mobileOtpInput || mobileOtpInput.length !== 6) {
      setMobileOtpError("Please enter the 6-digit OTP");
      return;
    }
    if (!confirmationResultRef.current) {
      setMobileOtpError("No active OTP session. Please send OTP again.");
      return;
    }
    setMobileOtpError("");
    setMobileOtpLoading(true);
    try {
      await confirmationResultRef.current.confirm(mobileOtpInput);
      const now = new Date();
      setDriverMobileVerified(true);
      setDriverMobileVerifiedAt(now);
      setMobileOtpError("");
    } catch (err: any) {
      console.error("[Driver Mobile OTP] Verify error:", err);
      setMobileOtpError("Invalid OTP code. Please try again.");
    } finally {
      setMobileOtpLoading(false);
    }
  };

  const sendDriverEmailOtp = async () => {
    const email = watch("driverGmail");
    const name = watch("driverName");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailOtpError("Please enter a valid driver email address first");
      return;
    }
    setEmailOtpError("");
    setEmailOtpLoading(true);
    try {
      const res = await api.post("/agent/send-driver-email-otp", { driverEmail: email, driverName: name });
      if (res.data?.success) {
        setEmailOtpSent(true);
        setEmailResendCooldown(30);
        alert("OTP sent successfully");
      } else {
        setEmailOtpError(res.data?.message || "Failed to send OTP");
        alert("Unable to send OTP");
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        const sec = err.response?.data?.remainingSeconds || 30;
        setEmailResendCooldown(sec);
        setEmailOtpError(`Please wait ${sec}s before resending`);
      } else {
        setEmailOtpError(err.response?.data?.message || "Failed to send OTP");
        alert("Unable to send OTP");
      }
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const verifyDriverEmailOtp = async () => {
    const email = watch("driverGmail");
    if (!emailOtpInput || emailOtpInput.length !== 6) {
      setEmailOtpError("Please enter the 6-digit OTP");
      return;
    }
    setEmailOtpError("");
    setEmailOtpLoading(true);
    try {
      const res = await api.post("/agent/verify-driver-email-otp", {
        driverEmail: email,
        otp: emailOtpInput,
      });
      if (res.data?.success) {
        setDriverEmailVerified(true);
        setDriverEmailVerifiedAt(new Date(res.data.driverEmailVerifiedAt));
        setEmailOtpError("");
      } else {
        setEmailOtpError(res.data?.message || "Verification failed");
      }
    } catch (err: any) {
      setEmailOtpError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const resetDriverVerification = () => {
    setDriverMobileVerified(false);
    setDriverMobileVerifiedAt(null);
    setDriverEmailVerified(false);
    setDriverEmailVerifiedAt(null);
    setMobileOtpSent(false);
    setMobileOtpInput("");
    setMobileOtpError("");
    setEmailOtpSent(false);
    setEmailOtpInput("");
    setEmailOtpError("");
    confirmationResultRef.current = null;
    setInitialDriverPhone("");
    setInitialDriverEmail("");
  };

  const openCreateMode = () => {
    if (!isProfileCompleted) {
      alert("Please complete profile verification first");
      return;
    }
    if (slotData && slotData.usedSlots >= slotData.tripSlots) {
      alert("Trip slot limit reached. Please complete existing trips or refer partners to increase your slots.");
      return;
    }
    reset();
    resetDriverVerification();
    setEditingTripId(null);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const openEditMode = (trip: any) => {
    reset({
      ...trip,
      coverImages: trip.coverImages || (trip.coverImage ? [trip.coverImage] : []),
      amenities: trip.amenities || trip.busAmenities || [],
      destinationCity: trip.destinations?.[0] || "",
      destinations: trip.destinations || [],
      originCity: trip.originCity || "",
      gstPercentage: trip.gstPercentage || 5,
    });
    setInitialDriverPhone(trip.driverPhone || "");
    setInitialDriverEmail(trip.driverGmail || "");
    setDriverMobileVerified(!!trip.driverMobileVerified);
    setDriverMobileVerifiedAt(trip.driverMobileVerifiedAt ? new Date(trip.driverMobileVerifiedAt) : null);
    setDriverEmailVerified(!!trip.driverEmailVerified);
    setDriverEmailVerifiedAt(trip.driverEmailVerifiedAt ? new Date(trip.driverEmailVerifiedAt) : null);
    setEditingTripId(trip._id);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingTripId(null);
    setMissingFieldsAlert([]);
    setSubmitError(null);
    resetDriverVerification();
  };

  // Helper to compile payload satisfying backend expectations
  const getPayload = (formData: TripFormData, isDraft: boolean) => {
    const dests = formData.destinations && formData.destinations.length > 0
      ? formData.destinations
      : (formData.itinerary || []).map(day => day.destination).filter(Boolean);
    const startLoc = formData.originCity || formData.itinerary?.[0]?.startLocation || "Salem";
    const payload: any = {
      ...formData,
      originCity: startLoc,
      shortDescription: formData.subtitle || formData.tagline || (formData.title ? formData.title.slice(0, 150) : ""),
      destinations: dests.length > 0 ? dests : ["Salem"],
      coverImage: formData.coverImages?.[0] || "",
      pricePerPerson: Number(formData.offerPrice || 0),
      driverPhone: formData.driverPhone || "",
      emergencyContact: formData.driverPhone || "9988776655",
      busType: formData.vehicleType || "Bus",
      status: isDraft ? "draft" : "published",
      // Driver verification flags
      driverMobileVerified,
      driverEmailVerified,
      driverMobileVerifiedAt: driverMobileVerifiedAt?.toISOString() || null,
      driverEmailVerifiedAt: driverEmailVerifiedAt?.toISOString() || null,
      itinerary: (formData.itinerary || []).map(item => ({
        ...item,
        description: item.notes || "Sightseeing/Travel",
      })),
    };

    if (formData.deadlineEnabled && formData.deadlineDate) {
      payload.bookingDeadline = formData.deadlineDate;
    } else {
      payload.bookingDeadline = "";
    }

    return payload;
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.message || "Failed to create trip");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTrip(id, data),
    onSuccess: (resData: any) => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.message || "Failed to update trip");
    }
  });

  const handleVerifyDateOtp = () => {
    setDateOtpError("");
    if (!dateOtpCode || dateOtpCode.length < 6) {
      setDateOtpError("Please enter a valid 6-digit OTP");
      return;
    }
    const formData = getValues();
    const payload = {
      ...getPayload(formData, false),
      dateChangeOtp: dateOtpCode
    };
    updateMutation.mutate({ id: editingTripId!, data: payload });
    setDateOtpModalOpen(false);
    setDateOtpCode("");
  };

  const deleteMutation = useMutation({
    mutationFn: ({ id, otp }: { id: string; otp?: string }) => deleteTrip(id, otp),
    onSuccess: (resData: any) => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      if (deleteWizardOpen) {
        setDeleteWizardSuccess("Trip deleted successfully!");
        setTimeout(() => {
          setDeleteWizardOpen(false);
          setDeletingTrip(null);
          setDeleteStep(1);
          setDeleteWizardSuccess("");
          setAgentOtpInput("");
        }, 2000);
      } else {
        alert("Trip deleted successfully");
      }
    },
    onError: (err: any) => {
      if (deleteWizardOpen) {
        setDeleteWizardError(err.response?.data?.message || "Deletion failed.");
      } else {
        alert(err.response?.data?.message || "Deletion failed");
      }
    }
  });

  const handleDeleteClick = (trip: any) => {
    if (!trip.bookedSeats || trip.bookedSeats === 0) {
      if (confirm("Are you sure you want to delete this trip?")) {
        deleteMutation.mutate({ id: trip._id });
      }
    } else {
      setDeletingTrip(trip);
      setDeleteStep(1);
      setDeleteWizardOpen(true);
      setDeleteWizardError("");
      setDeleteWizardSuccess("");
      setTravelerRefundBookings([]);
      setTravelerOtpInputs({});
      setTravelerVerifyingMap({});
      setAgentOtpInput("");
    }
  };

  const handleStartRefunds = async () => {
    setDeleteWizardError("");
    try {
      const res = await api.post(`/agent/trips/${deletingTrip._id}/start-refund`);
      if (res.data.success) {
        setTravelerRefundBookings(res.data.bookings || []);
        const otps: Record<string, string> = {};
        res.data.bookings.forEach((b: any) => {
          otps[b._id] = "";
        });
        setTravelerOtpInputs(otps);
        setDeleteStep(2);
      } else {
        setDeleteWizardError(res.data.message || "Failed to initiate refunds.");
      }
    } catch (err: any) {
      setDeleteWizardError(err.response?.data?.message || "Error processing refunds.");
    }
  };

  const handleVerifyTravelerOtp = async (bookingId: string) => {
    setDeleteWizardError("");
    setTravelerVerifyingMap(prev => ({ ...prev, [bookingId]: true }));
    try {
      const otpCode = travelerOtpInputs[bookingId];
      const res = await api.post(`/agent/trips/${deletingTrip._id}/verify-traveler-otp`, {
        bookingId,
        otp: otpCode
      });
      if (res.data.success) {
        setTravelerRefundBookings(prev => prev.map(b => b._id === bookingId ? { ...b, verified: true } : b));
        const updated = travelerRefundBookings.map(b => b._id === bookingId ? { ...b, verified: true } : b);
        const allOk = updated.every(b => b.verified);
        if (allOk) {
          setDeleteStep(3);
        }
      } else {
        setDeleteWizardError(res.data.message || "Invalid OTP code.");
      }
    } catch (err: any) {
      setDeleteWizardError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setTravelerVerifyingMap(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleConfirmAgentDelete = () => {
    setDeleteWizardError("");
    if (!agentOtpInput || agentOtpInput.length < 6) {
      setDeleteWizardError("Please enter a valid 6-digit Agent OTP.");
      return;
    }
    deleteMutation.mutate({ id: deletingTrip._id, otp: agentOtpInput });
  };

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      setShowPublishModal(false);
      alert("Trip published successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Publishing failed");
    }
  });

  const validateGoogleMapsUrl = (url: string) => {
    return /^https:\/\/(maps\.app\.goo\.gl\/|maps\.google\.com\/|goo\.gl\/maps\/)/.test(url);
  };

  const handlePublishClick = (trip: any) => {
    const depDate = new Date(trip.startDate);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (depDate < today) {
      alert("Trip departure date has expired.");
      return;
    }

    if (trip.deadlineEnabled && trip.deadlineDate) {
      const deadline = new Date(`${trip.deadlineDate}T${trip.deadlineTime || "23:59"}`);
      const now = new Date();
      if (now > deadline) {
        alert("Trip booking deadline has expired.");
        return;
      }
    }

    setPublishModalTrip(trip);
    setPublishConfirmInput("");
    setShowPublishModal(true);
  };

  const handlePublishConfirmSubmit = () => {
    if (publishConfirmInput.trim().toUpperCase() !== "PUBLISH") {
      alert("Please type PUBLISH exactly to confirm.");
      return;
    }
    publishMutation.mutate(publishModalTrip._id);
  };

  const onSubmit = (formData: TripFormData) => {
    setSubmitError(null);
    setMissingFieldsAlert([]);

    // ── 1. Validate Required Fields & Dates ──
    const missing: string[] = [];
    if (!formData.title) missing.push("Trip Name is required");
    if (!formData.coverImages || formData.coverImages.length === 0) missing.push("Main Destination Banner is required");
    if (!formData.pickupLocation) missing.push("Pickup Location is required");
    if (!validateGoogleMapsUrl(formData.pickupMapsLink)) missing.push("Valid Pickup Google Maps URL is required");
    if (!formData.dropPoint) missing.push("Drop Point is required");
    if (!validateGoogleMapsUrl(formData.dropMapsLink)) missing.push("Valid Drop Google Maps URL is required");

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) missing.push("Departure date cannot be after Return date");

    if (formData.deadlineEnabled && !formData.deadlineDate) {
      missing.push("Deadline date is required when enabled");
    }

    if (missing.length > 0) {
      setMissingFieldsAlert(missing);
      // Map fields to tabs
      const fieldToTab: Record<string, number> = {
        coverImages: 1,
        startDate: 2,
        deadlineDate: 2,
        originCity: 3,
        pickupLocation: 3,
        pickupMapsLink: 3,
        dropPoint: 3,
        dropMapsLink: 3,
        itinerary: 4,
        driverName: 6,
        driverPhone: 6,
        driverLicenseNumber: 6,
        busNumber: 6,
        originalPrice: 8,
        offerPrice: 8,
        totalSeats: 8,
      };

      for (const field of Object.keys(fieldToTab)) {
        if (field === "coverImages" && (!formData.coverImages || formData.coverImages.length === 0)) {
          setActiveTab(fieldToTab[field]);
          break;
        }
        if (field === "startDate" && start > end) {
          setActiveTab(fieldToTab[field]);
          break;
        }
        if (field === "deadlineDate" && formData.deadlineEnabled && !formData.deadlineDate) {
          setActiveTab(fieldToTab[field]);
          break;
        }
        if (field === "originCity" && !formData.originCity) {
          setActiveTab(fieldToTab[field]);
          break;
        }
        if (field === "pickupLocation" && !formData.pickupLocation) {
          setActiveTab(fieldToTab[field]);
          break;
        }
        if (field === "pickupMapsLink" && !validateGoogleMapsUrl(formData.pickupMapsLink)) {
          setActiveTab(fieldToTab[field]);
          break;
        }
        if (field === "dropPoint" && !formData.dropPoint) {
          setActiveTab(fieldToTab[field]);
          break;
        }
        if (field === "dropMapsLink" && !validateGoogleMapsUrl(formData.dropMapsLink)) {
          setActiveTab(fieldToTab[field]);
          break;
        }
      }
      return;
    }

    // ── 2. Validate Itinerary ──
    const duration = getValues("duration") || "";
    const durationDaysMatch = duration.match(/^(\d+)\s+Day/);
    const totalDays = durationDaysMatch ? parseInt(durationDaysMatch[1], 10) : 0;

    const rawItinerary = getValues("itinerary") || [];
    const itinerary = rawItinerary.map((day: any) => ({
      ...day,
      title: day.title || (day.startLocation && day.destination ? `Day ${day.day}: ${day.startLocation} to ${day.destination}` : "")
    }));

    const itineraryComplete =
      Array.isArray(itinerary) &&
      itinerary.length === totalDays &&
      itinerary.every(day =>
        day &&
        day.title &&
        day.activities &&
        day.activities.length > 0
      );

    if (!itineraryComplete) {
      alert("Please complete all itinerary days.");
      setSubmitError("Please complete all itinerary days.");
      return;
    }

    // ── 3. Validate Pricing ──
    const pricingMissing: string[] = [];
    if (formData.totalSeats <= 0) pricingMissing.push("Seat Capacity must be greater than 0");
    if (formData.offerPrice > formData.originalPrice) pricingMissing.push("Offer Price cannot exceed Original Price");

    if (pricingMissing.length > 0) {
      setMissingFieldsAlert(pricingMissing);
      setActiveTab(8);
      return;
    }

    // ── 4. Create Trip ──
    const payload = getPayload(getValues(), true);
    if (editingTripId) {
      updateMutation.mutate({ id: editingTripId, data: payload }, {
        onSuccess: (resData: any) => {
          if (resData && resData.success === false && resData.code === "OTP_REQUIRED") {
            setDateOtpModalOpen(true);
            return;
          }
          closeEditor();
          if (resData?.trip) {
            setPublishModalTrip(resData.trip);
            setShowPublishModal(true);
            setPublishConfirmInput("");
          }
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (resData) => {
          closeEditor();
          if (resData?.trip) {
            setPublishModalTrip(resData.trip);
            setShowPublishModal(true);
            setPublishConfirmInput("");
          }
        }
      });
    }
  };

  // Stepper buttons handler
  const handleNextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (activeTab === 1) {
      fieldsToValidate = ["title", "tripType", "coverImages"];
    } else if (activeTab === 2) {
      fieldsToValidate = ["startDate", "departureTime", "endDate", "returnTime"];
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
      
      const start = new Date(watch("startDate"));
      const end = new Date(watch("endDate"));
      if (start > end) {
        alert("Departure date cannot be after Return date");
        return;
      }
      
      if (watchDeadlineEnabled) {
        const deadlineValid = await trigger(["deadlineDate", "deadlineTime"] as any);
        if (!deadlineValid) return;
      }
      setActiveTab(prev => Math.min(10, prev + 1));
      return;
    } else if (activeTab === 3) {
      fieldsToValidate = ["originCity", "pickupLocation", "pickupMapsLink", "dropPoint", "dropMapsLink"];
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
      
      if (!watchDestinations || watchDestinations.length === 0) {
        alert("Please add at least one Destination City.");
        return;
      }
      setActiveTab(prev => Math.min(10, prev + 1));
      return;
    } else if (activeTab === 4) {
      const duration = getValues("duration") || "";
      const durationDaysMatch = duration.match(/^(\d+)\s+Day/);
      const totalDays = durationDaysMatch ? parseInt(durationDaysMatch[1], 10) : 0;
      
      const rawItinerary = getValues("itinerary") || [];
      const itinerary = rawItinerary.map((day: any) => ({
        ...day,
        title: day.title || (day.startLocation && day.destination ? `Day ${day.day}: ${day.startLocation} to ${day.destination}` : "")
      }));

      const itineraryComplete =
        Array.isArray(itinerary) &&
        itinerary.length === totalDays &&
        itinerary.every(day =>
          day &&
          day.title &&
          day.activities &&
          day.activities.length > 0
        );

      if (!itineraryComplete) {
        alert("Please complete all itinerary days.");
        return;
      }
      
      setActiveTab(prev => Math.min(10, prev + 1));
      return;
    } else if (activeTab === 6) {
      fieldsToValidate = ["driverName", "driverPhone", "driverLicenseNumber", "busNumber"];
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
      // Both driver contacts must be verified before proceeding
      if (!driverMobileVerified) {
        setMobileOtpError("Please verify the driver's mobile number before continuing.");
        return;
      }
      if (!driverEmailVerified) {
        setEmailOtpError("Please verify the driver's email address before continuing.");
        return;
      }
      setActiveTab(prev => Math.min(10, prev + 1));
      return;
    } else if (activeTab === 8) {
      fieldsToValidate = ["originalPrice", "offerPrice", "totalSeats"];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
    }

    setActiveTab(prev => Math.min(10, prev + 1));
  };

  const handlePrevStep = () => {
    setActiveTab(prev => Math.max(1, prev - 1));
  };

  const toggleAmenities = (amenity: string) => {
    const list = watchAmenities;
    if (list.includes(amenity)) {
      setValue("amenities", list.filter(x => x !== amenity));
    } else {
      setValue("amenities", [...list, amenity]);
    }
  };

  const toggleMeals = (meal: string) => {
    const list = watchMealsIncluded;
    if (list.includes(meal)) {
      setValue("mealsIncluded", list.filter(x => x !== meal));
    } else {
      setValue("mealsIncluded", [...list, meal]);
    }
  };

  const toggleActivities = (activity: string) => {
    const list = watchActivities;
    if (list.includes(activity)) {
      setValue("activities", list.filter(x => x !== activity));
    } else {
      setValue("activities", [...list, activity]);
    }
  };

  const addCustomActivity = () => {
    if (newActivity.trim() && !watchActivities.includes(newActivity.trim())) {
      setValue("activities", [...watchActivities, newActivity.trim()]);
      setNewActivity("");
    }
  };

  const addPackingItem = () => {
    if (newPackingItem.trim() && !watchPackingChecklist.includes(newPackingItem.trim())) {
      setValue("packingChecklist", [...watchPackingChecklist, newPackingItem.trim()]);
      setNewPackingItem("");
    }
  };

  const removePackingItem = (item: string) => {
    setValue("packingChecklist", watchPackingChecklist.filter(x => x !== item));
  };

  const moveDay = (fromIndex: number, toIndex: number) => {
    const list = [...watch("itinerary")];
    if (toIndex < 0 || toIndex >= list.length) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    // Re-index days
    list.forEach((item, idx) => {
      item.day = idx + 1;
    });
    setValue("itinerary", list);
  };

  const duplicateDay = (index: number) => {
    const current = watch("itinerary") || [];
    if (index >= 0 && index < current.length) {
      const copy = {
        ...current[index],
        day: current.length + 1,
        placesCovered: [...(current[index].placesCovered || [])],
        activities: [...(current[index].activities || [])]
      };
      const nextItinerary = [...current];
      nextItinerary.splice(index + 1, 0, copy);
      // Re-index days
      nextItinerary.forEach((item, idx) => {
        item.day = idx + 1;
      });
      setValue("itinerary", nextItinerary);
    }
  };

  const tabItems = [
    { step: 1, label: "Basic Information", icon: Info },
    { step: 2, label: "Date & Deadline", icon: Calendar },
    { step: 3, label: "Travel Route", icon: MapPin },
    { step: 4, label: "Journey Builder", icon: Compass },
    { step: 5, label: "Hotels & Food", icon: Hotel },
    { step: 6, label: "Transport", icon: Bus },
    { step: 7, label: "Activities", icon: BarChart3 },
    { step: 8, label: "Pricing", icon: IndianRupee },
    { step: 9, label: "Packing", icon: ShoppingBag },
    { step: 10, label: "Review & Publish", icon: Eye },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Trip Management
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Create group itineraries, coordinate bus fleets, and manage departures.
          </p>
        </div>
        {!editorOpen && (
          <Button 
            onClick={openCreateMode} 
            className="py-2.5"
            disabled={slotData ? (slotData.usedSlots >= slotData.tripSlots) : false}
          >
            <Plus className="w-4 h-4 mr-2" />
            Host New Trip
          </Button>
        )}
      </div>

      {/* Slots limit warning banner */}
      {slotData && (slotData.usedSlots >= slotData.tripSlots) && !editorOpen && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 animate-pulse" />
          <span>⚠️ Trip slot limit reached ({slotData.usedSlots}/{slotData.tripSlots} slots consumed). Please complete active trips or refer partners to increase your limits.</span>
        </div>
      )}

      {editorOpen ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Editor (8 Cols) */}
          <div className="lg:col-span-8">
            <GlassCard className="p-6">
              
              {/* Stepper Header */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.step;
                  return (
                    <button
                      key={tab.step}
                      type="button"
                      onClick={() => setActiveTab(tab.step)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        active ? "bg-teal-500 text-white shadow-brand" : "text-slate-400 dark:text-slate-550 hover:text-slate-650"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Tracker */}
              <div className="mb-6 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Step {activeTab} of 10</span>
                <span>{activeTab * 10}% Complete</span>
                <div className="w-2/3 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300"
                    style={{ width: `${activeTab * 10}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* STEP 1: Basic Info */}
                {activeTab === 1 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Basic Trip Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Trip Name *"
                        placeholder="e.g. Ooty Green Mountain Trek"
                        {...register("title", { required: "Trip Name is required" })}
                        error={errors.title?.message}
                      />
                      <Input
                        label="Short Title"
                        placeholder="e.g. 3D/2N Premium Stays"
                        {...register("subtitle")}
                      />
                    </div>
                    <Input
                      label="Tagline"
                      placeholder="e.g. Journey to the queen of hill stations"
                      {...register("tagline")}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Trip Type *"
                        placeholder="e.g. Family Tour, Temple Tour, Pilgrimage"
                        disabled={hasBookings}
                        {...register("tripType", { required: "Trip Type is required" })}
                        error={errors.tripType?.message}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <MultipleImageUpload
                        label="Main Destination Banner (Upload Multiple) *"
                        folder="covers"
                        values={watchCoverImages}
                        onChange={(urls) => setValue("coverImages", urls)}
                      />
                      <MultipleImageUpload
                        label="Gallery Images"
                        folder="gallery"
                        values={watchGallery}
                        onChange={(urls) => setValue("gallery", urls)}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Date & Deadline */}
                {activeTab === 2 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Date & Time Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Departure Date *"
                        type="date"
                        {...register("startDate", { required: "Start Date is required" })}
                        error={errors.startDate?.message}
                      />
                      <Input
                        label="Departure Time *"
                        type="time"
                        {...register("departureTime", { required: "Departure Time is required" })}
                        error={errors.departureTime?.message}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Return Date *"
                        type="date"
                        {...register("endDate", { required: "End Date is required" })}
                        error={errors.endDate?.message}
                      />
                      <Input
                        label="Return Time *"
                        type="time"
                        {...register("returnTime", { required: "Return time is required" })}
                        error={errors.returnTime?.message}
                      />
                    </div>
                    <Input
                      label="Duration (Calculated)"
                      readOnly
                      {...register("duration")}
                    />

                    {/* Deadline window toggle */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Enable Booking Deadline Limit
                          </label>
                          <p className="text-[10px] text-slate-450 mt-0.5">Disable to keep trip active until departure.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("deadlineEnabled", !watchDeadlineEnabled)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center ${
                            watchDeadlineEnabled ? "bg-teal-500 justify-end" : "bg-slate-300 dark:bg-slate-850 justify-start"
                          }`}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow" />
                        </button>
                      </div>

                      {watchDeadlineEnabled && (
                        <div className="grid grid-cols-2 gap-4 animate-scale-in">
                          <Input
                            label="Deadline Date *"
                            type="date"
                            {...register("deadlineDate")}
                          />
                          <Input
                            label="Deadline Time *"
                            type="time"
                            {...register("deadlineTime")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: Travel Route */}
                {activeTab === 3 && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-page">
                    {/* Left side: Inputs (8 Cols) */}
                    <div className="xl:col-span-8 space-y-6">
                      
                      {/* SECTION 0: Route Cities */}
                      <GlassCard strong className="p-5 space-y-4">
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs">1</span>
                          Route Cities
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Origin City *"
                            placeholder="e.g. Salem"
                            disabled={hasBookings}
                            {...register("originCity", { required: "Origin City is required" })}
                            error={errors.originCity?.message}
                          />
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                              Destination Cities (Add one or more) *
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {watchDestinations.map((city: string) => (
                                <span key={city} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 text-[10px] font-bold border border-teal-200/50">
                                  {city}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setValue("destinations", watchDestinations.filter((x: string) => x !== city));
                                    }}
                                    className="text-rose-500 hover:text-rose-700 font-extrabold ml-0.5"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <input
                              type="text"
                              placeholder="Type destination city & press Enter"
                              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full outline-none focus:border-teal-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val) {
                                    if (!watchDestinations.includes(val)) {
                                      setValue("destinations", [...watchDestinations, val]);
                                    }
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Main Route Preview */}
                        {watchOriginCity && watchDestinations.length > 0 && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/85 bg-white/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Main Route
                            </span>
                            <div className="text-sm font-black text-teal-600 dark:text-teal-400 flex flex-wrap items-center gap-1.5">
                              <span>{watchOriginCity}</span>
                              {watchDestinations.map((dest, i) => (
                                <React.Fragment key={i}>
                                  <span>→</span>
                                  <span>{dest}</span>
                                </React.Fragment>
                              ))}
                              <span>→</span>
                              <span>{watch("dropPoint") || watchOriginCity}</span>
                            </div>
                          </div>
                        )}
                      </GlassCard>

                      {/* SECTION 1: Pickup Information */}
                      <GlassCard strong className="p-5 space-y-4">
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs">2</span>
                          Pickup Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Pickup Point *"
                            placeholder="e.g. Salem Bus Stand"
                            disabled={hasBookings}
                            {...register("pickupLocation", { required: "Pickup Point is required" })}
                            error={errors.pickupLocation?.message}
                          />
                          <Input
                            label="Pickup Google Maps URL *"
                            placeholder="https://maps.google.com/..."
                            disabled={hasBookings}
                            {...register("pickupMapsLink", {
                              required: "Pickup Maps URL is required",
                              validate: (v) => validateGoogleMapsUrl(v) || "Valid Google Maps URL required"
                            })}
                            error={errors.pickupMapsLink?.message}
                          />
                        </div>
                      </GlassCard>

                      {/* SECTION 2: Drop Information */}
                      <GlassCard strong className="p-5 space-y-4">
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs">3</span>
                          Drop Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Drop Point *"
                            placeholder="e.g. Theni Bus Stand"
                            disabled={hasBookings}
                            {...register("dropPoint", { required: "Drop Point is required" })}
                            error={errors.dropPoint?.message}
                          />
                          <Input
                            label="Drop Google Maps URL *"
                            placeholder="https://maps.google.com/..."
                            disabled={hasBookings}
                            {...register("dropMapsLink", {
                              required: "Drop Maps URL is required",
                              validate: (v) => validateGoogleMapsUrl(v) || "Valid Google Maps URL required"
                            })}
                            error={errors.dropMapsLink?.message}
                          />
                        </div>
                      </GlassCard>

                    </div>

                    {/* Right side: Sticky Route Preview Card (4 Cols) */}
                    <div className="xl:col-span-4 sticky top-6 space-y-4">
                      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                        <div className="border-b border-slate-250 dark:border-slate-700 pb-2.5">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Route Preview Timeline
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                            Calculated Duration: <span className="text-teal-500 font-bold">{watch("duration")}</span>
                          </span>
                        </div>

                        <div className="flex flex-col items-center space-y-2 text-xs font-bold text-slate-650 dark:text-slate-355">
                          {/* Pickup point */}
                          <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 w-full shadow-xs">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Pickup Point</span>
                            <span className="text-slate-850 dark:text-slate-200 font-extrabold">
                              {watch("pickupLocation") || "Not specified"}
                            </span>
                          </div>

                          {/* Day Wise timeline */}
                          {watchItinerary.map((day: any, idx: number) => (
                            <React.Fragment key={idx}>
                              <div className="text-teal-500 text-base font-extrabold">↓</div>
                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 w-full space-y-2 shadow-xs">
                                <div className="flex justify-between items-center text-[10px] text-teal-600 dark:text-teal-400 font-black uppercase">
                                  <span>Day {day.day || idx + 1}</span>
                                  {day.date && <span>{day.date}</span>}
                                </div>
                                <div className="flex items-center justify-between text-slate-850 dark:text-slate-250 font-black">
                                  <span>{day.startLocation || "Start"}</span>
                                  <span className="text-slate-350 font-bold px-1.5">↓</span>
                                  <span>{day.destination || "Reach"}</span>
                                </div>
                                {day.nightStay && (
                                  <div className="text-[10px] text-slate-500 border-t border-slate-50 dark:border-slate-850/80 pt-1.5 flex justify-between items-center">
                                    <span>Night Stay:</span>
                                    <span className="text-slate-750 dark:text-slate-200 font-extrabold">
                                      {day.nightStay}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </React.Fragment>
                          ))}

                          {/* Drop point */}
                          <div className="text-teal-500 text-base font-extrabold">↓</div>
                          <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 w-full shadow-xs">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Return & Drop Point</span>
                            <span className="text-slate-850 dark:text-slate-200 font-extrabold">
                              {watch("dropPoint") || "Not specified"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Journey Builder */}
                {activeTab === 4 && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-page">
                    {/* Left side: Inputs (8 Cols) */}
                    <div className="xl:col-span-8 space-y-6">
                      <GlassCard strong className="p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                          <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs">4</span>
                            Journey Builder
                          </h3>
                        </div>

                        {itineraryFields.length === 0 ? (
                          <div className="text-center py-6 text-slate-450 italic text-xs">
                            No journey days added yet. Please specify trip dates in Step 2 to generate itinerary days.
                          </div>
                        ) : (
                          <div className="space-y-6 pt-2">
                            {itineraryFields.map((field, index) => (
                              <div key={field.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 space-y-4 relative animate-scale-in">
                                {/* Day Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                  <h4 className="text-xs font-black text-teal-655 dark:text-teal-400 uppercase tracking-widest">
                                    Day {index + 1} Journey details
                                  </h4>
                                </div>

                                {/* Inputs grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                  <Input
                                    label="Date *"
                                    type="date"
                                    readOnly
                                    {...register(`itinerary.${index}.date` as any, { required: "Date is required" })}
                                    error={(errors.itinerary?.[index] as any)?.date?.message}
                                  />
                                  <Input
                                    label="Start From *"
                                    placeholder="e.g. Salem"
                                    {...register(`itinerary.${index}.startLocation` as any, { required: "Start From is required" })}
                                    error={(errors.itinerary?.[index] as any)?.startLocation?.message}
                                  />
                                  <Input
                                    label="Reach (Destination) *"
                                    placeholder="e.g. Madurai"
                                    {...register(`itinerary.${index}.destination` as any, { required: "Reach Destination is required" })}
                                    error={(errors.itinerary?.[index] as any)?.destination?.message}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                  <Input
                                    label="Departure Time *"
                                    type="time"
                                    {...register(`itinerary.${index}.departureTime` as any, { required: "Departure time is required" })}
                                    error={(errors.itinerary?.[index] as any)?.departureTime?.message}
                                  />
                                  <Input
                                    label="Arrival Time *"
                                    type="time"
                                    {...register(`itinerary.${index}.arrivalTime` as any, { required: "Arrival time is required" })}
                                    error={(errors.itinerary?.[index] as any)?.arrivalTime?.message}
                                  />
                                  <Input
                                    label="Duration *"
                                    placeholder="e.g. 4 Hours"
                                    {...register(`itinerary.${index}.duration` as any, { required: "Duration is required" })}
                                    error={(errors.itinerary?.[index] as any)?.duration?.message}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                  <Input
                                    label="Night Stay *"
                                    placeholder="e.g. Madurai"
                                    {...register(`itinerary.${index}.nightStay` as any, { required: "Night Stay is required" })}
                                    error={(errors.itinerary?.[index] as any)?.nightStay?.message}
                                  />
                                  <Input
                                    label="Hotel Name *"
                                    placeholder="e.g. Grand Palace Hotel"
                                    {...register(`itinerary.${index}.hotelName` as any, { required: "Hotel Name is required" })}
                                    error={(errors.itinerary?.[index] as any)?.hotelName?.message}
                                  />
                                  <Input
                                    label="Notes *"
                                    placeholder="e.g. Dinner on own arrangements"
                                    {...register(`itinerary.${index}.notes` as any, { required: "Notes are required" })}
                                    error={(errors.itinerary?.[index] as any)?.notes?.message}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  {/* Places Covered tag inputs */}
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Places Covered *</label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {(watch(`itinerary.${index}.placesCovered` as any) || []).map((place: string) => (
                                        <span key={place} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 text-[10px] font-bold border border-teal-200/50">
                                          {place}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const current = watch(`itinerary.${index}.placesCovered` as any) || [];
                                              setValue(`itinerary.${index}.placesCovered` as any, current.filter((x: string) => x !== place));
                                            }}
                                            className="text-rose-500 hover:text-rose-700 font-extrabold ml-0.5"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Type place & press Enter"
                                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full outline-none focus:border-teal-500"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          const val = e.currentTarget.value.trim();
                                          if (val) {
                                            const current = watch(`itinerary.${index}.placesCovered` as any) || [];
                                            if (!current.includes(val)) {
                                              setValue(`itinerary.${index}.placesCovered` as any, [...current, val]);
                                            }
                                            e.currentTarget.value = "";
                                          }
                                        }
                                      }}
                                    />
                                    <input
                                      type="hidden"
                                      {...register(`itinerary.${index}.placesCovered` as any, {
                                        validate: (v: string[]) => (v && v.length > 0) || "Places Covered is required"
                                      })}
                                    />
                                    {(errors.itinerary?.[index] as any)?.placesCovered && (
                                      <span className="text-[10px] text-rose-500 font-semibold block mt-1">Places Covered is required</span>
                                    )}
                                  </div>

                                  {/* Activities tag inputs */}
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Activities *</label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {(watch(`itinerary.${index}.activities` as any) || []).map((act: string) => (
                                        <span key={act} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold border border-indigo-200/50">
                                          {act}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const current = watch(`itinerary.${index}.activities` as any) || [];
                                              setValue(`itinerary.${index}.activities` as any, current.filter((x: string) => x !== act));
                                            }}
                                            className="text-rose-500 hover:text-rose-700 font-extrabold ml-0.5"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Type activity & press Enter"
                                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full outline-none focus:border-teal-500"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          const val = e.currentTarget.value.trim();
                                          if (val) {
                                            const current = watch(`itinerary.${index}.activities` as any) || [];
                                            if (!current.includes(val)) {
                                              setValue(`itinerary.${index}.activities` as any, [...current, val]);
                                            }
                                            e.currentTarget.value = "";
                                          }
                                        }
                                      }}
                                    />
                                    <input
                                      type="hidden"
                                      {...register(`itinerary.${index}.activities` as any, {
                                        validate: (v: string[]) => (v && v.length > 0) || "Activities is required"
                                      })}
                                    />
                                    {(errors.itinerary?.[index] as any)?.activities && (
                                      <span className="text-[10px] text-rose-500 font-semibold block mt-1">Activities is required</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </GlassCard>
                    </div>

                    {/* Right side: Sticky Route Preview Card (4 Cols) */}
                    <div className="xl:col-span-4 sticky top-6 space-y-4">
                      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                        <div className="border-b border-slate-250 dark:border-slate-700 pb-2.5">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Route Preview Timeline
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                            Calculated Duration: <span className="text-teal-500 font-bold">{watch("duration")}</span>
                          </span>
                        </div>

                        <div className="flex flex-col items-center space-y-2 text-xs font-bold text-slate-650 dark:text-slate-355">
                          {/* Pickup point */}
                          <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 w-full shadow-xs">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Pickup Point</span>
                            <span className="text-slate-850 dark:text-slate-200 font-extrabold">
                              {watch("pickupLocation") || "Not specified"}
                            </span>
                          </div>

                          {/* Day Wise timeline */}
                          {watchItinerary.map((day: any, idx: number) => (
                            <React.Fragment key={idx}>
                              <div className="text-teal-500 text-base font-extrabold">↓</div>
                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 w-full space-y-2 shadow-xs">
                                <div className="flex justify-between items-center text-[10px] text-teal-650 dark:text-teal-400 font-black uppercase">
                                  <span>Day {day.day || idx + 1}</span>
                                  {day.date && <span>{day.date}</span>}
                                </div>
                                <div className="flex items-center justify-between text-slate-850 dark:text-slate-250 font-black">
                                  <span>{day.startLocation || "Start"}</span>
                                  <span className="text-slate-350 font-bold px-1.5">↓</span>
                                  <span>{day.destination || "Reach"}</span>
                                </div>
                                {day.nightStay && (
                                  <div className="text-[10px] text-slate-505 border-t border-slate-50 dark:border-slate-850/80 pt-1.5 flex justify-between items-center">
                                    <span>Night Stay:</span>
                                    <span className="text-slate-750 dark:text-slate-200 font-extrabold">
                                      {day.nightStay}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </React.Fragment>
                          ))}

                          {/* Drop point */}
                          <div className="text-teal-500 text-base font-extrabold">↓</div>
                          <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 w-full shadow-xs">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Return & Drop Point</span>
                            <span className="text-slate-850 dark:text-slate-200 font-extrabold">
                              {watch("dropPoint") || "Not specified"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Hotels & Food */}
                {activeTab === 5 && (
                  <div className="space-y-4 animate-page">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Hotel stays</h3>
                      <button
                        type="button"
                        onClick={() => appendHotel({
                          name: "", category: "3 Star", address: "", mapsLink: "", photos: [], roomType: "Double", occupancy: 2, nightStayCount: 1, notes: ""
                        })}
                        className="text-xs font-bold text-teal-500 hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Hotel
                      </button>
                    </div>

                    {hotelFields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-teal-500">Hotel #{index + 1} Details</h4>
                          {index > 0 && (
                            <button type="button" onClick={() => removeHotel(index)} className="text-rose-500 hover:underline text-xs">
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Hotel Name *" {...register(`hotels.${index}.name` as any)} />
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hotel Category</label>
                            <select
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none"
                              {...register(`hotels.${index}.category` as any)}
                            >
                              {HOTEL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Hotel Address *" {...register(`hotels.${index}.address` as any)} />
                          <Input label="Google Maps Link *" {...register(`hotels.${index}.mapsLink` as any)} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Room Type</label>
                            <select
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none"
                              {...register(`hotels.${index}.roomType` as any)}
                            >
                              {ROOM_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <Input label="Occupancy Count" type="number" {...register(`hotels.${index}.occupancy` as any)} />
                          <Input label="Nights Count" type="number" {...register(`hotels.${index}.nightStayCount` as any)} />
                          <Input label="Optional Notes" {...register(`hotels.${index}.notes` as any)} />
                        </div>

                        <MultipleImageUpload
                          label="Hotel Photos *"
                          folder="hotels"
                          values={watch(`hotels.${index}.photos` as any) || []}
                          onChange={(urls) => setValue(`hotels.${index}.photos` as any, urls)}
                        />
                      </div>
                    ))}

                    {/* Food Toggles */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Food Included
                          </label>
                          <p className="text-[10px] text-slate-450 mt-0.5">Toggle to specify if agency arranges meals.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("foodIncluded", !watch("foodIncluded"))}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                            watch("foodIncluded") ? "bg-teal-500 justify-end" : "bg-slate-300 dark:bg-slate-800 justify-start"
                          }`}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow" />
                        </button>
                      </div>

                      {!watch("foodIncluded") ? (
                        <p className="text-xs text-slate-400 italic">Food arrangements are self-managed.</p>
                      ) : (
                        <div className="flex gap-4 animate-scale-in">
                          {["Breakfast", "Lunch", "Dinner"].map((meal) => {
                            const has = watchMealsIncluded.includes(meal);
                            return (
                              <label key={meal} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={has}
                                  onChange={() => toggleMeals(meal)}
                                  className="w-4 h-4 accent-teal-500 rounded"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{meal}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 6: Transport */}
                {activeTab === 6 && (
                  <div className="space-y-4 animate-page">
                               <div>
                      <Input
                        label="Vehicle Type *"
                        placeholder="e.g. Sleeper Bus, Volvo AC, Cab, Tempo Traveller"
                        {...register("vehicleType", { required: "Vehicle Type required" })}
                        error={errors.vehicleType?.message}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                      <Input label="Driver Name *" {...register("driverName", { required: "Driver Name required" })} error={errors.driverName?.message} />
                      <Input label="Driver Phone *" maxLength={10} {...register("driverPhone", { required: "Driver Phone required" })} error={errors.driverPhone?.message} />
                    </div>

                    {/* ── Driver Verification Section ─────────────────────────────────── */}
                    <div id="driver-recaptcha-container" />
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Driver Verification Required
                        </span>
                      </div>

                      {/* Mobile OTP */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Driver Mobile</span>
                          {driverMobileVerified && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-auto">
                              <CheckCircle className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </div>

                        {!driverMobileVerified ? (
                          <>
                            <div className="flex gap-2">
                              <div className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 font-medium">
                                {watch("driverPhone") ? `+91 ${watch("driverPhone")}` : <span className="text-slate-400">Enter driver phone above first</span>}
                              </div>
                              <button
                                type="button"
                                onClick={sendDriverMobileOtp}
                                disabled={mobileOtpLoading || mobileResendCooldown > 0 || !watch("driverPhone")}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap flex items-center gap-1.5"
                              >
                                {mobileOtpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {mobileResendCooldown > 0 ? `Resend in ${mobileResendCooldown}s` : mobileOtpSent ? "Resend OTP" : "Send OTP"}
                              </button>
                            </div>

                            {mobileOtpSent && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  placeholder="Enter 6-digit OTP"
                                  value={mobileOtpInput}
                                  onChange={(e) => setMobileOtpInput(e.target.value.replace(/\D/g, ""))}
                                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 tracking-widest font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={verifyDriverMobileOtp}
                                  disabled={mobileOtpLoading || mobileOtpInput.length !== 6}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                >
                                  {mobileOtpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  Verify
                                </button>
                              </div>
                            )}

                            {mobileOtpError && (
                              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {mobileOtpError}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            +91 {watch("driverPhone")} ✅ Mobile Verified
                          </div>
                        )}
                      </div>

                      {/* Email OTP */}
                      <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Driver Email</span>
                          {driverEmailVerified && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-auto">
                              <CheckCircle className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </div>

                        {!driverEmailVerified ? (
                          <>
                            <div className="flex gap-2">
                              <div className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                                {watch("driverGmail") || <span className="text-slate-400">Enter driver Gmail above first</span>}
                              </div>
                              <button
                                type="button"
                                onClick={sendDriverEmailOtp}
                                disabled={emailOtpLoading || emailResendCooldown > 0 || !watch("driverGmail")}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap flex items-center gap-1.5"
                              >
                                {emailOtpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {emailOtpLoading ? "Sending OTP..." : emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : emailOtpSent ? "Resend OTP" : "Send OTP"}
                              </button>
                            </div>

                            {emailOtpSent && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  placeholder="Enter 6-digit OTP"
                                  value={emailOtpInput}
                                  onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ""))}
                                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 tracking-widest font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={verifyDriverEmailOtp}
                                  disabled={emailOtpLoading || emailOtpInput.length !== 6}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                >
                                  {emailOtpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  Verify
                                </button>
                              </div>
                            )}

                            {emailOtpError && (
                              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {emailOtpError}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            {watch("driverGmail")} ✅ Driver Email Verified
                          </div>
                        )}
                      </div>

                      {/* Gate message */}
                      {(!driverMobileVerified || !driverEmailVerified) && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 pt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Verify both driver contacts to enable Continue
                        </p>
                      )}
                    </div>
                    {/* ── End Driver Verification ─────────────────────────────────────── */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input label="Driver Gmail" type="email" {...register("driverGmail")} />
                      <Input label="License Number *" {...register("driverLicenseNumber", { required: "License required" })} error={errors.driverLicenseNumber?.message} />
                      <Input label="Vehicle Plate Number *" placeholder="e.g. KA-01-MJ-9988" {...register("busNumber", { required: "Vehicle number plate required" })} error={errors.busNumber?.message} />
                    </div>

                    {/* Vehicle Amenities (Manual Tagger) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vehicle Amenities</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(watchAmenities || []).map((am: string) => (
                          <span key={am} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 text-xs font-bold border border-teal-200/50">
                            {am}
                            <button
                              type="button"
                              onClick={() => setValue("amenities", watchAmenities.filter((x: string) => x !== am))}
                              className="text-rose-500 hover:text-rose-700 font-extrabold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Add amenity (e.g. AC, WiFi, TV) & press Enter"
                        className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none w-full focus:border-teal-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              if (!watchAmenities.includes(val)) {
                                setValue("amenities", [...watchAmenities, val]);
                              }
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Transport Image Uploads */}
                    <div className="border-t border-slate-105/50 dark:border-slate-800 pt-4 space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Transport Images</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImageUploadBox
                          label="Bus Front Image *"
                          folder="transport"
                          value={watchTransportImages?.frontImage || ""}
                          onChange={(url) => setValue("transportImages.frontImage", url)}
                        />
                        <ImageUploadBox
                          label="Bus Back Image *"
                          folder="transport"
                          value={watchTransportImages?.backImage || ""}
                          onChange={(url) => setValue("transportImages.backImage", url)}
                        />
                      </div>
                      <MultipleImageUpload
                        label="Bus Interior Images"
                        folder="transport"
                        values={watchTransportImages?.interiorImages || []}
                        onChange={(urls) => setValue("transportImages.interiorImages", urls)}
                      />
                      <MultipleImageUpload
                        label="Seat Layout Images"
                        folder="transport"
                        values={watchTransportImages?.seatImages || []}
                        onChange={(urls) => setValue("transportImages.seatImages", urls)}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 7: Activities */}
                {activeTab === 7 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Trip Activities</h3>
                    
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(watchActivities || []).map((act: string) => (
                        <span key={act} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 text-xs font-bold border border-teal-200/50">
                          {act}
                          <button
                            type="button"
                            onClick={() => setValue("activities", watchActivities.filter((x: string) => x !== act))}
                            className="text-rose-500 hover:text-rose-700 font-extrabold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 max-w-md">
                      <Input
                        label="Add Activity"
                        placeholder="e.g. Temple Visit, Boating, Sightseeing"
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomActivity();
                          }
                        }}
                      />
                      <Button type="button" onClick={addCustomActivity} className="self-end mb-4">
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 8: Pricing */}
                {activeTab === 8 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Pricing & Seat Capacities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input label="Original Price (₹) *" type="number" disabled={hasBookings} {...register("originalPrice", { required: "Original Price required" })} error={errors.originalPrice?.message} />
                      <Input label="Offer Price (₹) *" type="number" disabled={hasBookings} {...register("offerPrice", { required: "Offer Price required" })} error={errors.offerPrice?.message} />
                      <Input label="GST (%)" type="number" disabled={hasBookings} {...register("gstPercentage")} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Convenience Fee (₹)" type="number" disabled={hasBookings} {...register("convenienceFee")} />
                      <Input label="Seat Capacity *" type="number" disabled={hasBookings} {...register("totalSeats", { required: "Seat capacity required" })} error={errors.totalSeats?.message} />
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cancellation Policy</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none mb-3"
                        {...register("cancellationPolicy")}
                      >
                        <option value="No Cancellation">No Cancellation</option>
                        <option value="Fully Refundable">Fully Refundable</option>
                        <option value="Partial Refund">Partial Refund</option>
                        <option value="Custom">Custom (Datetime/Window based)</option>
                      </select>

                      {watchCancellationPolicy === "Custom" && (
                        <textarea
                          rows={4}
                          placeholder="e.g. Before 7 days: 100% refund, Before 3 days: 50% refund, Before 1 day: 25% refund, Less than 24 hours: No refund"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm focus:border-teal-500 outline-none"
                          {...register("customCancellationPolicy")}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 9: Packing */}
                {activeTab === 9 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Packing Checklist</h3>
                    <div className="flex gap-2 max-w-md">
                      <Input
                        label="Add Checklist Item"
                        placeholder="e.g. Sunscreen"
                        value={newPackingItem}
                        onChange={(e) => setNewPackingItem(e.target.value)}
                      />
                      <Button type="button" onClick={addPackingItem} className="self-end mb-4">
                        Add
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {watchPackingChecklist.map((item) => (
                        <div key={item} className="flex justify-between items-center p-3 border rounded-xl bg-slate-50/20">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item}</span>
                          <button type="button" onClick={() => removePackingItem(item)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 10: Preview */}
                {activeTab === 10 && (
                  <div className="space-y-6 animate-page max-h-[600px] overflow-y-auto pr-2">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Package Preview</h3>

                    {/* Basic Info */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div><strong>Trip Name:</strong> {watch("title")}</div>
                        <div><strong>Short Title:</strong> {watch("subtitle") || "N/A"}</div>
                        <div><strong>Tagline:</strong> {watch("tagline") || "N/A"}</div>
                        <div><strong>Trip Type:</strong> {watch("tripType")}</div>
                      </div>
                    </GlassCard>

                    {/* Banner Images & Gallery */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Destination Banners & Gallery</h4>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Main Banners ({watchCoverImages.length})</span>
                        {watchCoverImages.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {watchCoverImages.map((img, i) => (
                              <img key={i} src={img} alt={`Banner ${i+1}`} className="w-full h-20 object-cover rounded-lg border border-slate-100" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 italic font-bold">No destination banners uploaded yet!</span>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-105/50 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Gallery Images ({watchGallery.length})</span>
                        {watchGallery.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {watchGallery.map((img, i) => (
                              <img key={i} src={img} alt={`Gallery ${i+1}`} className="w-full h-20 object-cover rounded-lg border border-slate-105" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No gallery images uploaded yet</span>
                        )}
                      </div>
                    </GlassCard>

                    {/* Pickup Info */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Pickup Point Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div><strong>Pickup Point:</strong> {watch("pickupLocation")}</div>
                        <div>
                          <strong>Google Maps Link:</strong>{" "}
                          {watch("pickupMapsLink") ? (
                            <a href={watch("pickupMapsLink")} target="_blank" rel="noreferrer" className="text-teal-500 underline font-bold">
                              View on Maps
                            </a>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </div>
                      </div>
                    </GlassCard>

                    {/* Journey Plan (Timeline UI) */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Journey Planner Timeline</h4>
                      <div className="relative border-l-2 border-teal-200 dark:border-teal-900 ml-3 pl-6 space-y-6">
                        {(watch("itinerary") || []).map((day, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-[10px] text-white font-black">
                              {day.day}
                            </span>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-800 dark:text-white">
                                  {day.startLocation || "Start"} → {day.destination || "Reach"}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{day.date}</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-500">
                                <div>Departure: {day.departureTime || "—"}</div>
                                <div>Arrival: {day.arrivalTime || "—"}</div>
                                <div>Duration: {day.duration || "—"}</div>
                                <div>Night Stay: {day.nightStay || "—"}</div>
                              </div>
                              {day.hotelName && (
                                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                  Stay Hotel: 🏨 <span className="font-bold text-slate-700 dark:text-slate-300">{day.hotelName}</span>
                                </div>
                              )}
                              {day.placesCovered && day.placesCovered.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center pt-1">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Places:</span>
                                  {day.placesCovered.map((p, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[9px] font-semibold">{p}</span>
                                  ))}
                                </div>
                              )}
                              {day.activities && day.activities.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Activities:</span>
                                  {day.activities.map((a, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-[9px] font-semibold">{a}</span>
                                  ))}
                                </div>
                              )}
                              {day.notes && (
                                <p className="text-[10px] text-amber-600 italic">Notes: {day.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Hotel Stays */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Hotel & Food Settings</h4>
                      <div className="space-y-3">
                        {(watch("hotels") || []).map((hotel, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex justify-between items-center font-bold text-slate-700 dark:text-slate-200">
                              <span>🏨 {hotel.name} ({hotel.category})</span>
                              <span>{hotel.nightStayCount} Night(s)</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">{hotel.address}</div>
                            {hotel.photos && hotel.photos.length > 0 && (
                              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                                {hotel.photos.map((p, i) => (
                                  <img key={i} src={p} alt={`Hotel ${i+1}`} className="w-14 h-10 object-cover rounded" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="pt-2 border-t border-slate-105/50 dark:border-slate-800 text-xs flex justify-between items-center">
                          <span><strong>Meals Plan:</strong></span>
                          <span>
                            {watch("foodIncluded")
                              ? `Yes (${watchMealsIncluded.join(", ") || "No specific meals chosen"})`
                              : "Food arrangements are self-managed."}
                          </span>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Vehicle details */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Vehicle & Transport Configuration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div><strong>Vehicle Type:</strong> {watch("vehicleType")}</div>
                        <div><strong>Vehicle Plate No:</strong> {watch("busNumber")}</div>
                        <div><strong>Driver Name:</strong> {watch("driverName")}</div>
                        <div><strong>Driver Mobile:</strong> {watch("driverPhone")}</div>
                      </div>
                      {watchAmenities && watchAmenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mr-2">Amenities:</span>
                          {watchAmenities.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 text-[10px] font-bold border border-teal-100">{a}</span>
                          ))}
                        </div>
                      )}
                      {watchTransportImages && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {watchTransportImages.frontImage && (
                            <div>
                              <span className="text-[9px] text-slate-400 block mb-1">Front View</span>
                              <img src={watchTransportImages.frontImage} alt="Front View" className="w-full h-14 object-cover rounded-lg" />
                            </div>
                          )}
                          {watchTransportImages.backImage && (
                            <div>
                              <span className="text-[9px] text-slate-400 block mb-1">Back View</span>
                              <img src={watchTransportImages.backImage} alt="Back View" className="w-full h-14 object-cover rounded-lg" />
                            </div>
                          )}
                          {watchTransportImages.interiorImages && watchTransportImages.interiorImages.map((img: string, i: number) => (
                            <div key={i}>
                              <span className="text-[9px] text-slate-400 block mb-1">Interior #{i+1}</span>
                              <img src={img} alt="Interior View" className="w-full h-14 object-cover rounded-lg" />
                            </div>
                          ))}
                          {watchTransportImages.seatImages && watchTransportImages.seatImages.map((img: string, i: number) => (
                            <div key={i}>
                              <span className="text-[9px] text-slate-400 block mb-1">Seat Layout #{i+1}</span>
                              <img src={img} alt="Seat Layout View" className="w-full h-14 object-cover rounded-lg" />
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>

                    {/* Activities & Checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <GlassCard strong className="space-y-3">
                        <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Package Activities</h4>
                        <div className="flex flex-wrap gap-1">
                          {watchActivities && watchActivities.length > 0 ? (
                            watchActivities.map((a, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">{a}</span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No package activities defined</span>
                          )}
                        </div>
                      </GlassCard>

                      <GlassCard strong className="space-y-3">
                        <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Packing Checklist</h4>
                        <div className="flex flex-wrap gap-1">
                          {watchPackingChecklist && watchPackingChecklist.length > 0 ? (
                            watchPackingChecklist.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">{c}</span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No checklist items defined</span>
                          )}
                        </div>
                      </GlassCard>
                    </div>

                    {/* Pricing */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Pricing & Cancellation Policy</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div><strong>Offer Price:</strong> ₹{watch("offerPrice")}</div>
                        <div><strong>Original Price:</strong> ₹{watch("originalPrice")}</div>
                        <div><strong>Seats Available:</strong> {watch("totalSeats")} seats</div>
                        <div><strong>Cancellation:</strong> {watch("cancellationPolicy")}</div>
                      </div>
                    </GlassCard>

                    {/* Dates & Duration Summary */}
                    <GlassCard strong className="space-y-4">
                      <h4 className="text-xs font-extrabold text-teal-500 uppercase tracking-wider">Schedule Summary</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
                        <div>Departure: <span className="text-slate-800 dark:text-white font-extrabold">{watch("startDate")} {watch("departureTime")}</span></div>
                        <div>Return: <span className="text-slate-800 dark:text-white font-extrabold">{watch("endDate")} {watch("returnTime")}</span></div>
                        <div>Duration: <span className="text-teal-650 font-extrabold">{watch("duration")}</span></div>
                      </div>
                    </GlassCard>
                  </div>
                )}

                {/* Stepper Footer Buttons */}
                <div className="flex justify-between border-t border-slate-150 dark:border-slate-800 pt-6 mt-8">
                  <div className="flex gap-2">
                    {activeTab > 1 ? (
                      <Button type="button" variant="outline" onClick={handlePrevStep}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={closeEditor}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const payload = getPayload(watch(), true);
                        if (editingTripId) {
                          updateMutation.mutate({ id: editingTripId, data: payload }, {
                            onSuccess: () => {
                              closeEditor();
                              alert("Draft updated successfully");
                            }
                          });
                        } else {
                          createMutation.mutate(payload, {
                            onSuccess: () => {
                              closeEditor();
                              alert("Draft saved successfully");
                            }
                          });
                        }
                      }}
                      loading={createMutation.isPending || updateMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-1.5" /> Save Draft
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {activeTab < 10 ? (
                      <Button type="button" onClick={handleNextStep}>
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        {editingTripId ? "Update Package" : "Create Trip Package"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Validation Warnings list */}
                {missingFieldsAlert.length > 0 && (
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <p className="font-extrabold mb-1">Please fix the following validation errors:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {missingFieldsAlert.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
                {submitError && (
                  <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                    {submitError}
                  </div>
                )}
              </form>
            </GlassCard>
          </div>

          {/* Right Column: Live Preview Panel */}
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Live Package Preview</span>
            <div className="rounded-3xl border border-slate-150 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden shadow-md">
              <div className="relative h-44 w-full bg-slate-100">
                {watchCoverImages?.[0] ? (
                  <img src={watchCoverImages[0]} alt={watch("title")} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-black">
                    🏖️
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-black text-slate-700 shadow flex items-center gap-1">
                  <Clock size={11} className="text-teal-500" />
                  {watch("duration") || "3 Days / 2 Nights"}
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-teal-500 text-[10px] font-black text-white shadow">
                  {watch("tripType") || "Group Tour"}
                </div>
              </div>

              <div className="p-5 space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">
                    📍 {watchDestinations.length > 0 ? watchDestinations.join(", ") : (watch("destinationCity") || "No destinations")}
                  </span>
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white truncate mt-0.5">
                    {watch("title") || "Untitled Escapade"}
                  </h4>
                  {watch("tagline") && (
                    <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{watch("tagline")}</p>
                  )}
                  {watchItinerary.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-1.5">
                      <span>Itinerary Days:</span>
                      <span className="text-teal-650 font-black">{watchItinerary.length} Day(s)</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const startCity = watch("originCity") || watch("pickupLocation") || "";
                  const stops = watchItinerary.map((d: any) => d.destination).filter(Boolean);
                  const dropCity = watch("dropPoint") || startCity;
                  const pathElements = [startCity, ...stops];
                  if (dropCity && dropCity !== startCity) {
                    pathElements.push(dropCity);
                  }
                  const journeySummary = pathElements.filter(Boolean).join(" → ");
                  return journeySummary ? (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Journey Route</span>
                      <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 truncate mt-0.5" title={journeySummary}>
                        {journeySummary}
                      </p>
                    </div>
                  ) : null;
                })()}

                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {watch("startDate") ? (
                      `${formatDate(watch("startDate"))} - ${watch("endDate") ? formatDate(watch("endDate")) : ""}`
                    ) : (
                      "Trip Dates"
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus size={13} />
                    {watch("vehicleType") || "Bus"}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Offer Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-teal-600">₹{Number(watch("offerPrice") || 0).toLocaleString()}</span>
                      {Number(watch("originalPrice") || 0) > Number(watch("offerPrice") || 0) && (
                        <span className="text-[9px] text-slate-400 line-through">₹{Number(watch("originalPrice") || 0).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Seats</span>
                    <span className="text-xs font-extrabold text-slate-750 dark:text-slate-350">{watch("totalSeats") || 40} Seats</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Trips Grid List */
        trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-14 h-14 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {isProfileCompleted ? "No Hosted Trips Found" : "Your trips will appear here"}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-550 max-w-sm mt-1">
              {isProfileCompleted
                ? "You haven't listed any tours. Create your first group tour and display it on Traveloop!"
                : "Complete your agent profile first, then create your first group tour."}
            </p>
            {isProfileCompleted ? (
              <Button 
                onClick={openCreateMode} 
                className="mt-4"
                disabled={slotData ? (slotData.usedSlots >= slotData.tripSlots) : false}
              >
                <Plus className="w-4 h-4 mr-2" /> Create Trip Now
              </Button>
            ) : (
              <Button onClick={() => navigate("/complete-profile")} className="mt-4">
                <User className="w-4 h-4 mr-2" /> Complete Profile
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: any) => {
              const hasSaving = trip.originalPrice && trip.offerPrice && trip.originalPrice > trip.offerPrice;
              const isPublished = trip.status === "published";
              return (
                <GlassCard key={trip._id} className="premium-card flex flex-col justify-between p-0 overflow-hidden">
                  <div className="relative h-44 w-full bg-slate-100">
                    {trip.coverImage ? (
                      <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-3xl">
                        ✈️
                      </div>
                    )}
                    {trip.status === "draft" && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black tracking-widest shadow-lg uppercase">
                          DRAFT
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-black text-slate-700 shadow flex items-center gap-1.5 z-10">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      {trip.duration}
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow border flex items-center gap-1 bg-white/95 z-10">
                      {trip.approvalStatus === "approved" ? (
                        <span className="text-emerald-600">✓ Approved</span>
                      ) : trip.approvalStatus === "rejected" ? (
                        <span className="text-rose-600">✗ Rejected</span>
                      ) : (
                        <span className="text-orange-500 animate-pulse">⏰ Pending</span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 leading-snug line-clamp-1">
                        {trip.title}
                      </h3>
                      {trip.tagline && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{trip.tagline}</p>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(trip.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bus className="w-3.5 h-3.5 text-slate-400" /> {trip.vehicleType || "Bus"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                          <div className="flex items-baseline gap-2">
                            {hasSaving && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ₹{Number(trip.originalPrice).toLocaleString("en-IN")}
                              </span>
                            )}
                            <h4 className="text-base font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-0.5">
                              ₹{Number(trip.offerPrice || trip.pricePerPerson).toLocaleString("en-IN")}
                            </h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Seats</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 bg-emerald-50 text-emerald-600`}>
                            {trip.availableSeats} / {trip.totalSeats} left
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                        {!isPublished && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePublishClick(trip)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 font-bold text-xs py-2"
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditMode(trip)}
                          className="flex-1 text-xs py-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(trip)}
                          className="text-rose-500 p-2"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      {trip.approvalStatus === "rejected" && (
                        <div className="p-3 mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-[10px] font-bold text-rose-700 dark:text-rose-350">
                          <span className="font-extrabold uppercase tracking-wide block text-rose-805">Rejection Reason:</span>
                          <span className="mt-1 block leading-normal">{trip.rejectionReason || "Does not comply with platform guidelines."}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )
      )}

      {/* Publish Dialog Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-2">Publish Trip Package</h3>
            <p className="text-xs text-slate-450 mb-4 leading-relaxed">
              To publish this trip package and make it visible immediately on the Traveler Portal, please type <strong className="text-slate-800 dark:text-white">PUBLISH</strong> to confirm.
            </p>
            <Input
              placeholder="Type PUBLISH to confirm"
              value={publishConfirmInput}
              onChange={(e) => setPublishConfirmInput(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPublishModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePublishConfirmSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                Confirm & Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Date Change OTP Verification Modal */}
      <Modal
        isOpen={dateOtpModalOpen}
        onClose={() => setDateOtpModalOpen(false)}
        title="Verify Date Changes"
      >
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            Active bookings exist for this trip. Changing the departure/return date or deadline requires email OTP verification. An OTP has been sent to your registered agency email address.
          </p>

          <Input
            label="Enter Email OTP *"
            placeholder="6-digit verification code"
            maxLength={6}
            value={dateOtpCode}
            onChange={(e) => setDateOtpCode(e.target.value)}
          />

          {dateOtpError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-bold">
              {dateOtpError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDateOtpModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleVerifyDateOtp} className="flex-1">
              Verify & Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Trip & Refund Wizard Modal */}
      <Modal
        isOpen={deleteWizardOpen}
        onClose={() => setDeleteWizardOpen(false)}
        title="Delete Trip & Process Refunds"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-primary">
              Step {deleteStep} of 3
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {deleteStep === 1 && "Process Full Refund"}
              {deleteStep === 2 && "Traveler Verification"}
              {deleteStep === 3 && "Agent Confirmation"}
            </span>
          </div>

          {deleteStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 text-amber-700 text-xs font-bold leading-relaxed">
                Active bookings exist for this trip. Deleting this trip will automatically cancel all tickets and process a 100% full refund to all travelers.
              </div>
              <Button onClick={handleStartRefunds} className="w-full flex items-center justify-center gap-2">
                Initiate Full Refunds
              </Button>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold text-slate-500">
                Enter the OTP sent to each traveler to confirm refund receipt:
              </p>
              {travelerRefundBookings.map((b) => (
                <div key={b._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">{b.travelerName}</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1.5 py-0.5 rounded font-bold">Verification Pending</span>
                  </div>
                  {b.verified ? (
                    <div className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1">
                      ✓ Refund Completed
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Traveler OTP"
                        maxLength={6}
                        value={travelerOtpInputs[b._id] || ""}
                        onChange={(e) => setTravelerOtpInputs(prev => ({ ...prev, [b._id]: e.target.value }))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-855 text-xs font-bold bg-white dark:bg-slate-900 w-24"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleVerifyTravelerOtp(b._id)}
                        disabled={travelerVerifyingMap[b._id]}
                      >
                        {travelerVerifyingMap[b._id] ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {deleteStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 text-xs font-bold">
                All traveler refunds have been successfully verified and completed!
              </div>
              <Input
                label="Enter Agent Email OTP *"
                placeholder="6-digit verification code"
                maxLength={6}
                value={agentOtpInput}
                onChange={(e) => setAgentOtpInput(e.target.value)}
              />
              <Button onClick={handleConfirmAgentDelete} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold">
                Confirm & Permanently Delete Trip
              </Button>
            </div>
          )}

          {deleteWizardError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-bold">
              {deleteWizardError}
            </div>
          )}

          {deleteWizardSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 text-emerald-500 text-xs font-bold">
              {deleteWizardSuccess}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Trips;