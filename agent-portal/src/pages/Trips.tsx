import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth as firebaseAuth } from "../config/firebase";
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
  Sparkles,
  Check,
  Star,
  Wind,
  Tag,
  Zap,
  LayoutTemplate,
  RotateCcw,
} from "lucide-react";
import { GlassCard, Button, Input, ImageUploadBox, Modal } from "../components/ui";
import { TripLivePreview } from "../components/TripLivePreview";
import { TripTemplateSelector } from "../components/TripTemplateSelector";
import { DEMO_TRIP_TEMPLATES, TripTemplate } from "../data/tripTemplates";
import SuccessModal, { SuccessModalProps } from "../components/SuccessModal";
import {
  getMyTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  saveDraft,
  publishTrip,
  getMasterData,
  createMasterEntry,
  getAgentSlots,
} from "../services/tripService";
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

  // Route
  pickupLocation: string;
  pickupMapsLink: string;
  originCity?: string;
  destinations?: string[];
  intermediateStops?: string[];
  dropPoint?: string;
  dropMapsLink?: string;
  destinationCity?: string;

  // Date & Deadline
  startDate: string;
  departureTime: string;
  endDate: string;
  returnTime: string;
  duration: string;
  deadlineEnabled: boolean;
  deadlineDate: string;
  deadlineTime: string;

  // Itinerary
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
    title?: string;
    description?: string;
    hotel?: string;
    images?: string[];
    activity?: string;
    time?: string;
    lunch?: string;
    stay?: string;
  }>;

  // Hotels & Food
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

  // Transport
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

  // Activities & Packing
  activities: string[];
  packingChecklist: string[];

  // Pricing
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
  "Custom Tour",
];

const TRIP_CATEGORIES = ["Budget", "Standard", "Premium", "Luxury"];

const VEHICLE_TYPES = ["Bus", "Tempo Traveller", "Sleeper", "Van", "Cab"];

const BUS_AMENITIES_OPTIONS = [
  "AC",
  "Non AC",
  "Charging Port",
  "Blanket",
  "WiFi",
  "Pushback Seat",
  "Water Bottle",
  "TV",
  "Music System",
  "Emergency Kit",
  "First Aid",
  "GPS Tracking",
];

const HOTEL_CATEGORIES = ["3 Star", "4 Star", "5 Star"];
const ROOM_TYPES = ["Double", "Triple", "Family", "Suite"];

const DEFAULT_PACKING_ITEMS = [
  "Passport / ID",
  "Power Bank",
  "Comfortable Shoes",
  "First Aid & Medicine",
  "Umbrella / Raincoat",
  "Jacket",
  "Camera",
  "Water Bottle",
  "Cash",
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
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {values.map((url, idx) => (
          <div
            key={idx}
            className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-28 bg-slate-50 shadow-sm"
          >
            <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-full transition-colors shadow"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <div className="h-28">
          <ImageUploadBox label="" folder={folder} value="" onChange={handleAdd} />
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
  const [successModal, setSuccessModal] = useState<SuccessModalProps | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [editingTripId, setEditingTripId] = useState<string | null>(() =>
    sessionStorage.getItem("editingTripId")
  );
  const [filterTab, setFilterTab] = useState<"all" | "draft" | "pending" | "approved" | "rejected">("all");
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

  // Driver Verification States (Step 4)
  const [driverMobileVerified, setDriverMobileVerified] = useState(false);
  const [driverMobileVerifiedAt, setDriverMobileVerifiedAt] = useState<Date | null>(null);
  const [driverEmailVerified, setDriverEmailVerified] = useState(false);
  const [driverEmailVerifiedAt, setDriverEmailVerifiedAt] = useState<Date | null>(null);
  // Mobile OTP (Firebase)
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState("");
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileOtpError, setMobileOtpError] = useState("");
  const [mobileOtpSuccessToast, setMobileOtpSuccessToast] = useState(false);
  const [mobileResendCooldown, setMobileResendCooldown] = useState(0);
  // Email OTP
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  // Initial driver info
  const [initialDriverName, setInitialDriverName] = useState("");
  const [initialDriverPhone, setInitialDriverPhone] = useState("");
  const [initialDriverEmail, setInitialDriverEmail] = useState("");
  const [initialDriverLicense, setInitialDriverLicense] = useState("");
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
  const kycPassed = kycStatus === "KYC_COMPLETED" || kycStatus === "APPROVED";
  const adminApproved =
    agent?.profileCompleted === true &&
    (agent?.status === "approved" || agent?.status === "APPROVED");
  const isProfileCompleted = kycPassed || adminApproved;

  const { data, isLoading } = useQuery({
    queryKey: ["my-trips"],
    queryFn: getMyTrips,
  });

  useEffect(() => {
    const handleRealtimeUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["agent-slots"] });
    };

    socket.on("trip:published", handleRealtimeUpdate);
    socket.on("trip_published", handleRealtimeUpdate);
    socket.on("trip_approved", handleRealtimeUpdate);
    socket.on("trip_rejected", handleRealtimeUpdate);
    socket.on("trip_updated", handleRealtimeUpdate);

    return () => {
      socket.off("trip:published", handleRealtimeUpdate);
      socket.off("trip_published", handleRealtimeUpdate);
      socket.off("trip_approved", handleRealtimeUpdate);
      socket.off("trip_rejected", handleRealtimeUpdate);
      socket.off("trip_updated", handleRealtimeUpdate);
    };
  }, [queryClient]);

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
      category: "Premium",
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
      departureTime: "06:00",
      endDate: "",
      returnTime: "21:00",
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
        },
      ],
      hotels: [
        {
          name: "",
          category: "3 Star",
          address: "",
          mapsLink: "",
          photos: [],
          roomType: "Double",
          occupancy: 2,
          nightStayCount: 1,
          notes: "",
        },
      ],
      foodIncluded: true,
      mealsIncluded: ["Breakfast", "Dinner"],
      vehicleType: "Bus",
      driverName: "",
      driverPhone: "",
      driverGmail: "",
      driverLicenseNumber: "",
      busNumber: "",
      amenities: ["AC", "Charging Port", "WiFi", "Water Bottle"],
      busAmenities: ["AC", "Charging Port", "WiFi", "Water Bottle"],
      activities: ["Sightseeing", "Photography"],
      packingChecklist: DEFAULT_PACKING_ITEMS,
      originalPrice: 5000,
      offerPrice: 4500,
      gstPercentage: 5,
      convenienceFee: 150,
      totalSeats: 40,
      cancellationPolicy: "Fully Refundable",
      customCancellationPolicy: "",
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
  const watchAll = watch();
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

  // Auto-calculate Duration & sync Itinerary Days
  useEffect(() => {
    if (!watchStartDate || !watchEndDate) return;
    const start = new Date(watchStartDate + "T00:00:00");
    const end = new Date(watchEndDate + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const diffTime = end.getTime() - start.getTime();
    let totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) totalDays = 1;

    const days = totalDays;
    const nights = totalDays;
    const durationStr = `${days} Day${days !== 1 ? "s" : ""} / ${nights} Night${
      nights !== 1 ? "s" : ""
    }`;

    if (watch("duration") !== durationStr) {
      setValue("duration", durationStr);
    }

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

  // Driver verification sync — automatically invalidate verification when driver fields are edited
  const watchDriverName = watch("driverName");
  const watchDriverPhone = watch("driverPhone");
  const watchDriverGmail = watch("driverGmail");
  const watchDriverLicense = watch("driverLicenseNumber");

  useEffect(() => {
    if (initialDriverName && watchDriverName !== initialDriverName) {
      setDriverMobileVerified(false);
      setDriverMobileVerifiedAt(null);
      setDriverEmailVerified(false);
      setDriverEmailVerifiedAt(null);
      setMobileOtpSent(false);
      setEmailOtpSent(false);
    }
  }, [watchDriverName, initialDriverName]);

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

  useEffect(() => {
    if (initialDriverLicense && watchDriverLicense !== initialDriverLicense) {
      setDriverMobileVerified(false);
      setDriverMobileVerifiedAt(null);
      setDriverEmailVerified(false);
      setDriverEmailVerifiedAt(null);
      setMobileOtpSent(false);
      setEmailOtpSent(false);
    }
  }, [watchDriverLicense, initialDriverLicense]);

  // Timers
  useEffect(() => {
    if (mobileResendCooldown <= 0) return;
    const timer = setTimeout(() => setMobileResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [mobileResendCooldown]);

  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const timer = setTimeout(() => setEmailResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailResendCooldown]);

  // Verification Handlers
  const sendDriverMobileOtp = async () => {
    const phone = watch("driverPhone");
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      setMobileOtpError("Please enter a valid 10-digit driver mobile number first");
      return;
    }
    setMobileOtpError("");
    setMobileOtpLoading(true);
    try {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (_) {}
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
      setDriverMobileVerified(true);
      setDriverMobileVerifiedAt(new Date());
      setInitialDriverPhone(watch("driverPhone") || "");
      setInitialDriverName(watch("driverName") || "");
      setInitialDriverLicense(watch("driverLicenseNumber") || "");
      setMobileOtpSent(false);
      setMobileOtpInput("");
      setMobileOtpSuccessToast(true);
      setTimeout(() => setMobileOtpSuccessToast(false), 5000);
    } catch (err: any) {
      console.error("[Driver Mobile OTP] Verification error:", err);
      setMobileOtpError("Invalid OTP. Please enter the correct verification code.");
    } finally {
      setMobileOtpLoading(false);
    }
  };

  const sendDriverEmailOtp = async () => {
    const rawEmail = watch("driverGmail");
    if (!rawEmail || !rawEmail.trim()) {
      setEmailOtpError("Please enter a valid driver email address.");
      return;
    }
    const email = rawEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailOtpError("Please enter a valid driver email address.");
      return;
    }
    setEmailOtpError("");
    setEmailOtpLoading(true);
    try {
      const res = await api.post("/driver/send-email-otp", { email });
      if (res.data.success) {
        setEmailOtpSent(true);
        setEmailResendCooldown(30);
        setEmailOtpInput("");
      } else {
        setEmailOtpError(res.data.message || "Unable to send verification email. Please try again later.");
      }
    } catch (err: any) {
      console.error("[Driver Email OTP] Send error:", err);
      if (err.response?.status === 404) {
        setEmailOtpError("Email verification service is unavailable.");
      } else {
        setEmailOtpError(
          err.response?.data?.message || "Unable to send verification email. Please try again later."
        );
      }
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const verifyDriverEmailOtp = async () => {
    const email = watch("driverGmail")?.trim() || "";
    if (!emailOtpInput || emailOtpInput.trim().length !== 6) {
      setEmailOtpError("Invalid verification code.");
      return;
    }
    setEmailOtpError("");
    setEmailOtpLoading(true);
    try {
      const res = await api.post("/driver/verify-email-otp", {
        email,
        otp: emailOtpInput.trim(),
      });

      if (res.data.success && (res.data.verified || res.data.emailVerified)) {
        setDriverEmailVerified(true);
        setDriverEmailVerifiedAt(new Date());
        setInitialDriverEmail(email);
        setInitialDriverName(watch("driverName") || "");
        setInitialDriverLicense(watch("driverLicenseNumber") || "");
        setEmailOtpSent(false);
        setEmailOtpInput("");
      } else {
        setEmailOtpError(res.data.message || "Invalid verification code.");
      }
    } catch (err: any) {
      console.error("[Driver Email OTP] Verify error:", err);
      if (err.response?.status === 404) {
        setEmailOtpError("Email verification service is unavailable.");
      } else {
        setEmailOtpError(
          err.response?.data?.message || "Invalid verification code."
        );
      }
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
    setInitialDriverName("");
    setInitialDriverPhone("");
    setInitialDriverEmail("");
    setInitialDriverLicense("");
    confirmationResultRef.current = null;
  };

  const openCreateMode = () => {
    if (slotData && slotData.usedSlots >= slotData.tripSlots) {
      alert(
        "Trip slot limit reached. Please complete existing trips or refer partners to increase your slots."
      );
      return;
    }
    reset();
    resetDriverVerification();
    setEditingTripId(null);
    setSelectedTemplate(null);
    setShowTemplateSelector(true);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const openEditMode = (trip: any) => {
    reset({
      ...trip,
      coverImages: trip.coverImages || (trip.coverImage ? [trip.coverImage] : []),
      amenities: trip.amenities || trip.busAmenities || ["AC", "WiFi"],
      destinationCity: trip.destinations?.[0] || "",
      destinations: trip.destinations || [],
      originCity: trip.originCity || "",
      gstPercentage: trip.gstPercentage || 5,
    });
    setInitialDriverName(trip.driverName || "");
    setInitialDriverPhone(trip.driverPhone || "");
    setInitialDriverEmail(trip.driverGmail || "");
    setInitialDriverLicense(trip.driverLicenseNumber || "");
    setDriverMobileVerified(!!trip.driverMobileVerified);
    setDriverMobileVerifiedAt(
      trip.driverMobileVerifiedAt ? new Date(trip.driverMobileVerifiedAt) : null
    );
    setDriverEmailVerified(!!trip.driverEmailVerified);
    setDriverEmailVerifiedAt(
      trip.driverEmailVerifiedAt ? new Date(trip.driverEmailVerifiedAt) : null
    );
    setEditingTripId(trip._id);
    setSelectedTemplate(null);
    setShowTemplateSelector(false);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setShowTemplateSelector(false);
    setSelectedTemplate(null);
    setEditingTripId(null);
    setMissingFieldsAlert([]);
    setSubmitError(null);
    resetDriverVerification();
  };

  // ── TEMPLATE SELECTION HANDLERS ──────────────────────────────────────────
  const handleSelectTemplate = (template: TripTemplate) => {
    setSelectedTemplate(template);

    // Default upcoming dates (tomorrow -> +duration days)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const startDateStr = tomorrow.toISOString().split("T")[0];

    const durDaysMatch = template.duration.match(/^(\d+)\s+Day/);
    const totalDays = durDaysMatch ? parseInt(durDaysMatch[1], 10) : 3;

    const returnDate = new Date(tomorrow);
    returnDate.setDate(tomorrow.getDate() + totalDays - 1);
    const endDateStr = returnDate.toISOString().split("T")[0];

    // Populate form state (driver fields intentionally left empty)
    reset({
      title: template.title,
      subtitle: template.subtitle,
      tagline: template.tagline,
      tripType: template.tripType,
      category: template.category,
      coverImages: template.coverImages,
      coverImage: template.coverImage,
      gallery: template.gallery,
      status: "draft",
      pickupLocation: template.pickupLocation,
      pickupMapsLink: template.pickupMapsLink,
      dropPoint: template.dropPoint,
      dropMapsLink: template.dropMapsLink,
      originCity: template.originCity,
      destinations: template.destinations,
      startDate: startDateStr,
      departureTime: "06:00",
      endDate: endDateStr,
      returnTime: "21:00",
      duration: template.duration,
      deadlineEnabled: false,
      deadlineDate: "",
      deadlineTime: "23:59",
      itinerary: template.itinerary,
      hotels: template.hotels.map((h) => ({
        name: h.name,
        category: h.category,
        address: h.address,
        mapsLink: "",
        photos: h.photos,
        roomType: h.roomType,
        occupancy: h.occupancy,
        nightStayCount: h.nightStayCount,
        notes: "",
      })),
      foodIncluded: template.foodIncluded,
      mealsIncluded: template.mealsIncluded,
      vehicleType: template.vehicleType,
      busNumber: template.busNumber,
      amenities: template.amenities,
      busAmenities: template.amenities,
      activities: template.includes,
      packingChecklist: DEFAULT_PACKING_ITEMS,
      originalPrice: template.originalPrice,
      offerPrice: template.offerPrice,
      gstPercentage: 5,
      convenienceFee: 150,
      totalSeats: template.totalSeats,
      cancellationPolicy: "Fully Refundable",
      customCancellationPolicy: "",
      driverName: "",
      driverPhone: "",
      driverGmail: "",
      driverLicenseNumber: "",
    });

    // Reset Driver verification completely so driver section starts empty & unverified
    resetDriverVerification();

    setShowTemplateSelector(false);
    // Jump straight to Step 2 (Trip Schedule) so agent can adjust Travel Dates
    setActiveTab(2);
  };

  const handleStartScratch = () => {
    setSelectedTemplate(null);
    setShowTemplateSelector(false);
    reset();
    resetDriverVerification();
    setActiveTab(1);
  };

  const getPayload = (formData: TripFormData, isDraft: boolean) => {
    const dests =
      formData.destinations && formData.destinations.length > 0
        ? formData.destinations
        : (formData.itinerary || []).map((day) => day.destination).filter(Boolean);
    const startLoc =
      formData.originCity || formData.itinerary?.[0]?.startLocation || "Origin City";
    const payload: any = {
      ...formData,
      originCity: startLoc,
      shortDescription:
        formData.subtitle ||
        formData.tagline ||
        (formData.title ? formData.title.slice(0, 150) : ""),
      destinations: dests.length > 0 ? dests : ["Destination City"],
      coverImage: formData.coverImages?.[0] || "",
      pricePerPerson: Number(formData.offerPrice || 0),
      driverPhone: formData.driverPhone || "",
      emergencyContact: formData.driverPhone || "9988776655",
      busType: formData.vehicleType || "Bus",
      status: isDraft ? "draft" : "published",
      driverMobileVerified,
      driverEmailVerified,
      driverMobileVerifiedAt: driverMobileVerifiedAt?.toISOString() || null,
      driverEmailVerifiedAt: driverEmailVerifiedAt?.toISOString() || null,
      itinerary: (formData.itinerary || []).map((item) => ({
        ...item,
        description: item.notes || "Sightseeing & Activities",
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
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTrip(id, data),
    onSuccess: (resData: any) => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.message || "Failed to update trip");
    },
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
      dateChangeOtp: dateOtpCode,
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
    },
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
    setTravelerVerifyingMap((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const otpCode = travelerOtpInputs[bookingId];
      const res = await api.post(`/agent/trips/${deletingTrip._id}/verify-traveler-otp`, {
        bookingId,
        otp: otpCode,
      });
      if (res.data.success) {
        setTravelerRefundBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, verified: true } : b))
        );
        const updated = travelerRefundBookings.map((b) =>
          b._id === bookingId ? { ...b, verified: true } : b
        );
        if (updated.every((b) => b.verified)) {
          setDeleteStep(3);
        }
      } else {
        setDeleteWizardError(res.data.message || "Invalid OTP code.");
      }
    } catch (err: any) {
      setDeleteWizardError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setTravelerVerifyingMap((prev) => ({ ...prev, [bookingId]: false }));
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
      setSuccessModal({
        isOpen: true,
        onClose: () => setSuccessModal(null),
        title: "Trip Submitted Successfully",
        description: "Trip submitted successfully. It will become visible to travelers after admin approval.",
        statusText: "Pending Admin Approval",
        reviewTimeText: "Within 24 Hours",
        visibilityText: "Visible only to you",
        notificationText: "Status: Pending Approval",
        infoDetails: [
          { label: "Pending Review", value: "Submitted successfully for admin review" },
          { label: "Until Approval", value: "Visible only to you · Not visible to Travelers" },
          { label: "Status", value: "Pending Approval" },
          { label: "Estimated Review Time", value: "Within 24 Hours" },
        ],
        primaryButtonText: "Return to My Trips",
        secondaryButtonText: "",
        onPrimary: () => { setEditorOpen(false); },
      });
    },
    onError: (err: any) => {
      setSuccessModal({
        isOpen: true,
        onClose: () => setSuccessModal(null),
        title: "Publishing Failed",
        description: err.response?.data?.message || "There was an issue submitting your trip for review. Please check your trip details and try again.",
        variant: "error",
        statusText: "Failed",
        reviewTimeText: "N/A",
        visibilityText: "Draft Only",
        notificationText: "System Error",
        primaryButtonText: "Close",
        secondaryButtonText: "",
      });
    },
  });

  const validateGoogleMapsUrl = (url: string) => {
    return /^https:\/\/(maps\.app\.goo\.gl\/|maps\.google\.com\/|goo\.gl\/maps\/)/.test(url);
  };

  const handlePublishClick = (trip: any) => {
    const depDate = new Date(trip.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    if (!driverMobileVerified || !driverEmailVerified) {
      alert("Driver verification is required before publishing this trip. Please complete both mobile and email verification.");
      return;
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

  const onSubmitDraft = (formData: TripFormData) => {
    const payload = getPayload(formData, true);
    if (editingTripId) {
      updateMutation.mutate(
        { id: editingTripId, data: payload },
        {
          onSuccess: () => {
            closeEditor();
            alert("Draft updated successfully");
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          closeEditor();
          alert("Draft saved successfully");
        },
      });
    }
  };

  const onSubmit = (formData: TripFormData) => {
    setSubmitError(null);
    setMissingFieldsAlert([]);

    if (!driverMobileVerified || !driverEmailVerified) {
      const incompleteMsg = "Driver verification is required before publishing this trip. Please complete both mobile and email verification.";
      alert(incompleteMsg);
      setMissingFieldsAlert([incompleteMsg]);
      setActiveTab(4);
      return;
    }

    // Validate Required Fields & Dates
    const missing: string[] = [];
    if (!formData.title) missing.push("Trip Name is required");
    if (!formData.coverImages || formData.coverImages.length === 0)
      missing.push("Main Destination Banner is required");
    if (!formData.pickupLocation) missing.push("Pickup Location is required");
    if (!validateGoogleMapsUrl(formData.pickupMapsLink))
      missing.push("Valid Pickup Google Maps URL is required");
    if (!formData.dropPoint) missing.push("Drop Point is required");
    if (!validateGoogleMapsUrl(formData.dropMapsLink))
      missing.push("Valid Drop Google Maps URL is required");

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) missing.push("Departure date cannot be after Return date");

    if (formData.deadlineEnabled && !formData.deadlineDate) {
      missing.push("Deadline date is required when enabled");
    }

    if (missing.length > 0) {
      setMissingFieldsAlert(missing);
      const fieldToStep: Record<string, number> = {
        coverImages: 1,
        title: 1,
        startDate: 2,
        deadlineDate: 2,
        originalPrice: 3,
        offerPrice: 3,
        totalSeats: 3,
        pickupLocation: 4,
        pickupMapsLink: 4,
        dropPoint: 4,
        dropMapsLink: 4,
        driverName: 4,
        driverPhone: 4,
        hotels: 5,
        itinerary: 6,
      };

      for (const field of Object.keys(fieldToStep)) {
        if (
          field === "coverImages" &&
          (!formData.coverImages || formData.coverImages.length === 0)
        ) {
          setActiveTab(fieldToStep[field]);
          break;
        }
        if (field === "startDate" && start > end) {
          setActiveTab(fieldToStep[field]);
          break;
        }
        if (field === "pickupLocation" && !formData.pickupLocation) {
          setActiveTab(fieldToStep[field]);
          break;
        }
      }
      return;
    }

    // Validate Itinerary
    const duration = getValues("duration") || "";
    const durationDaysMatch = duration.match(/^(\d+)\s+Day/);
    const totalDays = durationDaysMatch ? parseInt(durationDaysMatch[1], 10) : 0;

    const rawItinerary = getValues("itinerary") || [];
    const itinerary = rawItinerary.map((day: any) => ({
      ...day,
      title:
        day.title ||
        (day.startLocation && day.destination
          ? `Day ${day.day}: ${day.startLocation} to ${day.destination}`
          : ""),
    }));

    const itineraryComplete =
      Array.isArray(itinerary) &&
      itinerary.length === totalDays &&
      itinerary.every(
        (day) => day && day.startLocation && day.destination
      );

    if (!itineraryComplete) {
      alert("Please complete all itinerary days.");
      setSubmitError("Please complete all itinerary days.");
      setActiveTab(6);
      return;
    }

    // Validate Pricing
    const pricingMissing: string[] = [];
    if (formData.totalSeats <= 0)
      pricingMissing.push("Seat Capacity must be greater than 0");
    if (formData.offerPrice > formData.originalPrice)
      pricingMissing.push("Offer Price cannot exceed Original Price");

    if (pricingMissing.length > 0) {
      setMissingFieldsAlert(pricingMissing);
      setActiveTab(3);
      return;
    }

    // Submit Trip
    const payload = getPayload(getValues(), false);
    console.log("[Trips Page] Payload before submitting to backend:", JSON.stringify(payload, null, 2));

    if (editingTripId) {
      updateMutation.mutate(
        { id: editingTripId, data: payload },
        {
          onSuccess: (resData: any) => {
            if (
              resData &&
              resData.success === false &&
              resData.code === "OTP_REQUIRED"
            ) {
              setDateOtpModalOpen(true);
              return;
            }
            closeEditor();
            if (resData?.trip) {
              setPublishModalTrip(resData.trip);
              setShowPublishModal(true);
              setPublishConfirmInput("");
            }
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (resData) => {
          closeEditor();
          if (resData?.trip) {
            setPublishModalTrip(resData.trip);
            setShowPublishModal(true);
            setPublishConfirmInput("");
          }
        },
      });
    }
  };

  // Stepper Next Step validation handler
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
      setActiveTab((prev) => Math.min(7, prev + 1));
      return;
    } else if (activeTab === 3) {
      fieldsToValidate = ["originalPrice", "offerPrice", "totalSeats"];
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;

      if (Number(watch("offerPrice")) > Number(watch("originalPrice"))) {
        alert("Offer Price cannot exceed Original Price");
        return;
      }
      setActiveTab((prev) => Math.min(7, prev + 1));
      return;
    } else if (activeTab === 4) {
      fieldsToValidate = [
        "originCity",
        "pickupLocation",
        "pickupMapsLink",
        "dropPoint",
        "dropMapsLink",
        "driverName",
        "driverPhone",
        "driverLicenseNumber",
        "busNumber",
      ];
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;

      if (!driverMobileVerified) {
        setMobileOtpError("Please verify the driver's mobile number before continuing.");
        return;
      }
      if (!driverEmailVerified) {
        setEmailOtpError("Please verify the driver's email address before continuing.");
        return;
      }
      setActiveTab((prev) => Math.min(7, prev + 1));
      return;
    } else if (activeTab === 5) {
      fieldsToValidate = ["hotels"];
    } else if (activeTab === 6) {
      const duration = getValues("duration") || "";
      const durationDaysMatch = duration.match(/^(\d+)\s+Day/);
      const totalDays = durationDaysMatch ? parseInt(durationDaysMatch[1], 10) : 0;

      const rawItinerary = getValues("itinerary") || [];
      const itineraryComplete =
        Array.isArray(rawItinerary) &&
        rawItinerary.length === totalDays &&
        rawItinerary.every((day) => day && day.startLocation && day.destination);

      if (!itineraryComplete) {
        alert("Please specify Start Location and Destination for all itinerary days.");
        return;
      }
      setActiveTab((prev) => Math.min(7, prev + 1));
      return;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
    }

    setActiveTab((prev) => Math.min(7, prev + 1));
  };

  const handlePrevStep = () => {
    setActiveTab((prev) => Math.max(1, prev - 1));
  };

  const toggleAmenities = (amenity: string) => {
    const list = watchAmenities;
    if (list.includes(amenity)) {
      setValue(
        "amenities",
        list.filter((x) => x !== amenity)
      );
    } else {
      setValue("amenities", [...list, amenity]);
    }
  };

  const toggleMeals = (meal: string) => {
    const list = watchMealsIncluded;
    if (list.includes(meal)) {
      setValue(
        "mealsIncluded",
        list.filter((x) => x !== meal)
      );
    } else {
      setValue("mealsIncluded", [...list, meal]);
    }
  };

  const tabItems = [
    { step: 1, label: "Basic Information", icon: Info, desc: "Title & Media" },
    { step: 2, label: "Trip Schedule", icon: Calendar, desc: "Dates & Deadlines" },
    { step: 3, label: "Pricing & Seats", icon: IndianRupee, desc: "Fares & Capacity" },
    { step: 4, label: "Transport Details", icon: Bus, desc: "Fleet & Driver OTP" },
    { step: 5, label: "Stay & Meals", icon: Hotel, desc: "Hotel Star & Meal Plan" },
    { step: 6, label: "Day-wise Itinerary", icon: Compass, desc: "Daily Timeline" },
    { step: 7, label: "Review & Publish", icon: FileCheck, desc: "Final Launch" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Top Bar / Header ── */}
      {!editorOpen ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Trips Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Create group itineraries, coordinate bus fleets, and manage departures.
            </p>
          </div>
          <Button
            onClick={openCreateMode}
            className="py-2.5 px-5 font-extrabold shadow-lg"
            disabled={slotData ? slotData.usedSlots >= slotData.tripSlots : false}
          >
            <Plus className="w-4 h-4 mr-2" />
            Host New Trip
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeEditor}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs flex items-center gap-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Trips
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {showTemplateSelector
                  ? "Select a Trip Template"
                  : editingTripId
                  ? "Edit Trip Package"
                  : "Create New Trip"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Publish professional travel packages in under 30 seconds.
              </p>
            </div>
          </div>

          {!showTemplateSelector && (
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateSelector(true)}
                className="py-2 px-3.5 text-xs font-bold flex items-center gap-1.5"
              >
                <LayoutTemplate className="w-4 h-4 text-teal-500" />
                Change Template
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit((formData) => onSubmitDraft(formData))}
                className="py-2 px-4 text-xs font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Save Draft
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab(7)}
                className="py-2 px-4 text-xs font-bold flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-teal-400" />
                Preview
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                className="py-2 px-5 text-xs font-black flex items-center gap-2 shadow-brand"
              >
                <CheckCircle className="w-4 h-4" />
                {editingTripId ? "Update Trip" : "Publish Trip"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Slots limit warning banner */}
      {slotData && slotData.usedSlots >= slotData.tripSlots && !editorOpen && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 animate-pulse" />
          <span>
            ⚠️ Trip slot limit reached ({slotData.usedSlots}/{slotData.tripSlots} slots consumed). Please complete active trips or refer partners to increase your limits.
          </span>
        </div>
      )}

      {/* ── Main View Handler ── */}
      {editorOpen ? (
        showTemplateSelector ? (
          /* STEP 0: Template Selection Grid */
          <TripTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            onStartScratch={handleStartScratch}
          />
        ) : (
          /* STEP 1-7: Form Editor & Sticky Live Preview */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Left Column: Form Stepper (70% Desktop) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Template Pre-filled Info Banner */}
              {selectedTemplate && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border border-teal-500/30 flex items-center justify-between shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold">
                      <Zap size={18} className="fill-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider block">
                        Template Auto-Filled 100%
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {selectedTemplate.title} ({selectedTemplate.duration})
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelector(true)}
                    className="px-3 py-1.5 rounded-xl border border-teal-500/40 text-teal-700 dark:text-teal-300 text-[11px] font-extrabold hover:bg-teal-500/20 transition-all flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Switch Template
                  </button>
                </div>
              )}

              <GlassCard strong className="p-6 space-y-6 shadow-xl border-slate-200/80 dark:border-slate-800">
                {/* Stepper Header (7 Steps) */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3 border-b border-slate-100 dark:border-slate-800">
                  {tabItems.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.step;
                    const isPassed = activeTab > tab.step;
                    return (
                      <button
                        key={tab.step}
                        type="button"
                        onClick={() => setActiveTab(tab.step)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          active
                            ? "bg-teal-500 text-white shadow-brand scale-102"
                            : isPassed
                            ? "bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 hover:bg-slate-200/70"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            active
                              ? "bg-white text-teal-600"
                              : isPassed
                              ? "bg-teal-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                          }`}
                        >
                          {isPassed ? <Check size={12} /> : tab.step}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                  <span className="text-teal-600 dark:text-teal-400">
                    Step {activeTab} of 7 — {tabItems[activeTab - 1]?.label}
                  </span>
                  <span>{Math.round((activeTab / 7) * 100)}% Completed</span>
                  <div className="w-1/2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ml-4">
                    <div
                      className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                      style={{ width: `${(activeTab / 7) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Validation alert banner */}
                {missingFieldsAlert.length > 0 && (
                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400 space-y-1">
                    <p className="font-extrabold flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Please fix the following validation items:
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      {missingFieldsAlert.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* STEP 1: Basic Information */}
                  {activeTab === 1 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Step 1: Basic Package Information
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Set package title, tour category, and high quality media banners.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Trip Package Name *"
                          placeholder="e.g. Ooty Green Mountain & Tea Gardens Escape"
                          {...register("title", { required: "Trip Name is required" })}
                          error={errors.title?.message}
                        />
                        <Input
                          label="Short Subtitle"
                          placeholder="e.g. 3 Days / 2 Nights Premium Mountain Stays"
                          {...register("subtitle")}
                        />
                      </div>

                      {/* Category Selection Cards */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Trip Category / Type *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {TRIP_TYPES.map((type) => {
                            const selected = watch("tripType") === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setValue("tripType", type)}
                                disabled={hasBookings}
                                className={`p-3 rounded-2xl border text-center transition-all text-xs font-bold ${
                                  selected
                                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 shadow-xs"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Input
                        label="Catchy Tagline"
                        placeholder="e.g. Experience misty hilltops, pristine lakes, and tea estate walks"
                        {...register("tagline")}
                      />

                      {/* Route Cities Tagger */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          Destination Cities (Add one or more) *
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {watchDestinations.map((city: string) => (
                            <span
                              key={city}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 text-xs font-bold border border-teal-200/50"
                            >
                              <MapPin size={12} /> {city}
                              <button
                                type="button"
                                onClick={() =>
                                  setValue(
                                    "destinations",
                                    watchDestinations.filter((x: string) => x !== city)
                                  )
                                }
                                className="text-rose-500 hover:text-rose-700 font-extrabold ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Type destination city (e.g. Ooty, Coonoor) & press Enter"
                          className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full outline-none focus:border-teal-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !watchDestinations.includes(val)) {
                                setValue("destinations", [...watchDestinations, val]);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>

                      {/* Media Uploads */}
                      <div className="space-y-4 pt-2">
                        <MultipleImageUpload
                          label="Main Destination Cover Banners (Multiple Upload) *"
                          folder="covers"
                          values={watchCoverImages}
                          onChange={(urls) => setValue("coverImages", urls)}
                        />
                        <MultipleImageUpload
                          label="Gallery Photos (Sightseeing & Highlights)"
                          folder="gallery"
                          values={watchGallery}
                          onChange={(urls) => setValue("gallery", urls)}
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Trip Schedule */}
                  {activeTab === 2 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Step 2: Departure & Schedule Setup
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Configure departure dates, return times, and auto-calculated duration.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Departure Date *"
                          type="date"
                          {...register("startDate", { required: "Start Date is required" })}
                          error={errors.startDate?.message}
                        />
                        <Input
                          label="Reporting & Departure Time *"
                          type="time"
                          {...register("departureTime", { required: "Departure Time required" })}
                          error={errors.departureTime?.message}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Return Date *"
                          type="date"
                          {...register("endDate", { required: "End Date is required" })}
                          error={errors.endDate?.message}
                        />
                        <Input
                          label="Return Time *"
                          type="time"
                          {...register("returnTime", { required: "Return time required" })}
                          error={errors.returnTime?.message}
                        />
                      </div>

                      <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider block">
                            Calculated Trip Duration
                          </span>
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {watch("duration") || "3 Days / 2 Nights"}
                          </span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-teal-500 text-white text-xs font-bold shadow-sm">
                          Auto Synced
                        </span>
                      </div>

                      {/* Deadline Toggle */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                              Enable Booking Deadline Cutoff
                            </label>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Automatically stop accepting bookings before departure date.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setValue("deadlineEnabled", !watchDeadlineEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center ${
                              watchDeadlineEnabled
                                ? "bg-teal-500 justify-end"
                                : "bg-slate-300 dark:bg-slate-800 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 bg-white rounded-full shadow" />
                          </button>
                        </div>

                        {watchDeadlineEnabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-scale-in">
                            <Input label="Deadline Cutoff Date *" type="date" {...register("deadlineDate")} />
                            <Input label="Deadline Cutoff Time *" type="time" {...register("deadlineTime")} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Pricing & Seats */}
                  {activeTab === 3 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Step 3: Pricing, GST & Seat Capacity
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Define ticket fares, offer discounts, seat capacity, and cancellation policies.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Original Price (₹) *"
                          type="number"
                          disabled={hasBookings}
                          {...register("originalPrice", { required: "Original Price required" })}
                          error={errors.originalPrice?.message}
                        />
                        <Input
                          label="Offer Price / Person (₹) *"
                          type="number"
                          disabled={hasBookings}
                          {...register("offerPrice", { required: "Offer Price required" })}
                          error={errors.offerPrice?.message}
                        />
                        <Input
                          label="Total Seat Capacity *"
                          type="number"
                          disabled={hasBookings}
                          {...register("totalSeats", { required: "Seat capacity required" })}
                          error={errors.totalSeats?.message}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Convenience / Advance Fee (₹)"
                          type="number"
                          disabled={hasBookings}
                          {...register("convenienceFee")}
                        />
                        <Input
                          label="GST Tax Percentage (%)"
                          type="number"
                          disabled={hasBookings}
                          {...register("gstPercentage")}
                        />
                      </div>

                      {/* Cancellation Policy */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          Cancellation & Refund Policy
                        </label>
                        <select
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs font-bold outline-none focus:border-teal-500"
                          {...register("cancellationPolicy")}
                        >
                          <option value="Fully Refundable">Fully Refundable (100% refund prior to departure)</option>
                          <option value="Partial Refund">Partial Refund (Standard cancellation charges apply)</option>
                          <option value="No Cancellation">Non-Refundable Ticket</option>
                          <option value="Custom">Custom Cancellation Terms</option>
                        </select>

                        {watchCancellationPolicy === "Custom" && (
                          <textarea
                            rows={3}
                            placeholder="Specify custom refund rules (e.g., 7 days prior: 100%, 3 days prior: 50%, <24 hrs: No refund)"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                            {...register("customCancellationPolicy")}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Transport Details */}
                  {activeTab === 4 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Step 4: Fleet & Transport Configuration
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Vehicle specifications, pickup/drop coordinates, amenities, and driver verification.
                        </p>
                      </div>

                      {/* Vehicle Type Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Vehicle Fleet Type *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {VEHICLE_TYPES.map((type) => {
                            const selected = watch("vehicleType") === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setValue("vehicleType", type)}
                                className={`p-3 rounded-2xl border text-center transition-all text-xs font-bold ${
                                  selected
                                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 shadow-xs"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Origin City *"
                          placeholder="e.g. Salem"
                          disabled={hasBookings}
                          {...register("originCity", { required: "Origin City is required" })}
                          error={errors.originCity?.message}
                        />
                        <Input
                          label="Vehicle Plate / Bus Number *"
                          placeholder="e.g. KA-01-MJ-9988"
                          {...register("busNumber", { required: "Vehicle number required" })}
                          error={errors.busNumber?.message}
                        />
                      </div>

                      {/* Pickup & Drop Points */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                        <Input
                          label="Pickup Point *"
                          placeholder="e.g. Salem New Bus Stand"
                          disabled={hasBookings}
                          {...register("pickupLocation", { required: "Pickup Point required" })}
                          error={errors.pickupLocation?.message}
                        />
                        <Input
                          label="Pickup Google Maps URL *"
                          placeholder="https://maps.google.com/..."
                          disabled={hasBookings}
                          {...register("pickupMapsLink", {
                            required: "Pickup Maps URL is required",
                            validate: (v) => validateGoogleMapsUrl(v) || "Valid Google Maps URL required",
                          })}
                          error={errors.pickupMapsLink?.message}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                        <Input
                          label="Drop Point *"
                          placeholder="e.g. Ooty Main Bus Stand"
                          disabled={hasBookings}
                          {...register("dropPoint", { required: "Drop Point required" })}
                          error={errors.dropPoint?.message}
                        />
                        <Input
                          label="Drop Google Maps URL *"
                          placeholder="https://maps.google.com/..."
                          disabled={hasBookings}
                          {...register("dropMapsLink", {
                            required: "Drop Maps URL is required",
                            validate: (v) => validateGoogleMapsUrl(v) || "Valid Google Maps URL required",
                          })}
                          error={errors.dropMapsLink?.message}
                        />
                      </div>

                      {/* Vehicle Amenities Chips */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          Vehicle Amenities & Facilities
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {BUS_AMENITIES_OPTIONS.map((am) => {
                            const active = watchAmenities.includes(am);
                            return (
                              <button
                                key={am}
                                type="button"
                                onClick={() => toggleAmenities(am)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                  active
                                    ? "bg-teal-500 text-white border-teal-500 shadow-xs"
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                                }`}
                              >
                                {active ? <Check size={12} /> : null}
                                {am}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Fleet Photos */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                          Bus / Vehicle Photos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ImageUploadBox
                            label="Bus Exterior Front Image *"
                            folder="transport"
                            value={watchTransportImages?.frontImage || ""}
                            onChange={(url) => setValue("transportImages.frontImage", url)}
                          />
                          <ImageUploadBox
                            label="Bus Exterior Rear Image *"
                            folder="transport"
                            value={watchTransportImages?.backImage || ""}
                            onChange={(url) => setValue("transportImages.backImage", url)}
                          />
                        </div>
                        <MultipleImageUpload
                          label="Bus Interior & Seating Layout Photos"
                          folder="transport"
                          values={watchTransportImages?.interiorImages || []}
                          onChange={(urls) => setValue("transportImages.interiorImages", urls)}
                        />
                      </div>

                      {/* Driver Verification Section */}
                      <div id="driver-recaptcha-container" />
                      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 bg-slate-50/70 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-teal-500" />
                          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                            Driver Details & Live OTP Verification
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <Input
                            label="Driver Full Name *"
                            {...register("driverName", { required: "Driver Name required" })}
                            error={errors.driverName?.message}
                          />
                          <Input
                            label="Driver Mobile Number *"
                            maxLength={10}
                            disabled={driverMobileVerified}
                            {...register("driverPhone", { required: "Driver Phone required" })}
                            error={errors.driverPhone?.message}
                          />
                          <Input
                            label="Driver Email Address *"
                            type="email"
                            placeholder="ramesh.driver@gmail.com"
                            disabled={driverEmailVerified}
                            {...register("driverGmail", {
                              required: "Driver Email is required",
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Please enter a valid driver email address.",
                              },
                            })}
                            error={errors.driverGmail?.message}
                          />
                          <Input
                            label="Driver License Number *"
                            {...register("driverLicenseNumber", { required: "License required" })}
                            error={errors.driverLicenseNumber?.message}
                          />
                        </div>

                        {/* Mobile OTP */}
                        <div className="space-y-2 border-t border-slate-200/60 dark:border-slate-800 pt-3">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Mobile OTP Verification
                            </span>
                            {driverMobileVerified && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-auto">
                                <CheckCircle className="w-4 h-4" /> Mobile Verified
                              </span>
                            )}
                          </div>

                          {mobileOtpSuccessToast && (
                            <div className="p-3 rounded-2xl bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg animate-scale-in">
                              <CheckCircle size={16} /> Mobile Verified! Driver phone number authenticated with Firebase.
                            </div>
                          )}

                          {driverMobileVerified ? (
                            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-500" /> Mobile Verified (Authenticated via Firebase)
                              </span>
                              <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-black uppercase">
                                Locked & Verified
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <div className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-bold">
                                  {watch("driverPhone")
                                    ? `+91 ${watch("driverPhone")}`
                                    : "Enter driver phone number above first"}
                                </div>
                                <button
                                  type="button"
                                  onClick={sendDriverMobileOtp}
                                  disabled={mobileOtpLoading || mobileResendCooldown > 0 || !watch("driverPhone")}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50 transition-all whitespace-nowrap flex items-center gap-1.5"
                                >
                                  {mobileOtpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  {mobileResendCooldown > 0
                                    ? `Resend in ${mobileResendCooldown}s`
                                    : mobileOtpSent
                                    ? "Resend OTP"
                                    : "Send OTP"}
                                </button>
                              </div>

                              {mobileOtpSent && (
                                <div className="flex gap-2 animate-scale-in">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="6-digit OTP"
                                    value={mobileOtpInput}
                                    onChange={(e) => setMobileOtpInput(e.target.value.replace(/\D/g, ""))}
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-teal-500 font-mono tracking-widest"
                                  />
                                  <button
                                    type="button"
                                    onClick={verifyDriverMobileOtp}
                                    disabled={mobileOtpLoading || mobileOtpInput.length !== 6}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-all flex items-center gap-1.5"
                                  >
                                    {mobileOtpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                    Verify
                                  </button>
                                </div>
                              )}

                              {mobileOtpError && (
                                <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                                  <AlertTriangle size={12} /> {mobileOtpError}
                                </p>
                              )}

                              {/* Demo Firebase Testing Credentials Helper Card (dev mode) */}
                              {import.meta.env.DEV && (
                                <div className="mt-2 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2 text-xs text-amber-800 dark:text-amber-300 animate-fade-in">
                                  <div className="flex items-center justify-between font-extrabold">
                                    <span className="flex items-center gap-1.5">
                                      <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                                      Demo Firebase Testing Credentials
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setValue("driverPhone", "1234567890");
                                        setMobileOtpInput("123456");
                                      }}
                                      className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-all shadow-xs"
                                    >
                                      Auto-fill Demo Credentials
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium">
                                    <div>
                                      Phone Number: <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">+91 1234567890</code>
                                    </div>
                                    <div>
                                      OTP Code: <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">123456</code>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Driver Email Verification Section */}
                        <div className="space-y-3 border-t border-slate-200/60 dark:border-slate-800 pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Driver Email Verification
                              </span>
                            </div>
                            {driverEmailVerified && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] uppercase">
                                Verified
                              </span>
                            )}
                          </div>

                          {driverEmailVerified ? (
                            <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2 text-xs text-emerald-900 dark:text-emerald-200 animate-fade-in shadow-xs">
                              <div className="flex items-center justify-between font-black">
                                <span className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  Driver Email Verification
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] uppercase shadow-xs">
                                  🟢 Verified Successfully
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-1 text-emerald-800 dark:text-emerald-300">
                                <p className="font-semibold">
                                  📧 Driver Email: <code className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-950 dark:text-emerald-100">{watch("driverGmail")}</code>
                                </p>
                                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  Verified on {driverEmailVerifiedAt ? driverEmailVerifiedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-3 text-xs animate-fade-in">
                              <div className="flex items-center justify-between font-black">
                                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                  <Mail className="w-4 h-4 text-teal-500" />
                                  Driver Email Status
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase">
                                  🟡 {emailOtpSent ? "OTP Code Sent" : "Pending Verification"}
                                </span>
                              </div>

                              <p className="text-slate-600 dark:text-slate-300 font-medium">
                                📧 Driver Email: <code className="font-mono font-bold bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-900 dark:text-slate-100">{watch("driverGmail") || "No email entered"}</code>
                              </p>

                              {emailOtpError && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>{emailOtpError}</span>
                                </div>
                              )}

                              {!emailOtpSent ? (
                                <button
                                  type="button"
                                  onClick={sendDriverEmailOtp}
                                  disabled={emailOtpLoading || !watch("driverGmail")}
                                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
                                >
                                  {emailOtpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                  Send Email OTP
                                </button>
                              ) : (
                                <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                                  <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Enter 6-Digit Verification Code
                                  </label>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={6}
                                      placeholder="834271"
                                      value={emailOtpInput}
                                      onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ""))}
                                      className="w-40 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono tracking-widest outline-none focus:border-teal-500 font-bold"
                                    />
                                    <button
                                      type="button"
                                      onClick={verifyDriverEmailOtp}
                                      disabled={emailOtpLoading || emailOtpInput.length !== 6}
                                      className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-xs"
                                    >
                                      {emailOtpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                      Verify
                                    </button>
                                    <button
                                      type="button"
                                      onClick={sendDriverEmailOtp}
                                      disabled={emailOtpLoading || emailResendCooldown > 0}
                                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all"
                                    >
                                      {emailResendCooldown > 0 ? `Resend OTP (${emailResendCooldown}s)` : "Resend OTP"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {(!driverMobileVerified || !driverEmailVerified) && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 pt-1">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            Driver verification is required before publishing this trip. Please complete both mobile and email verification.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Accommodation & Meals */}
                  {activeTab === 5 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Step 5: Hotel Stay & Meal Plan Setup
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Configure stay hotel details, room occupancy, star ratings, and included meal plan.
                        </p>
                      </div>

                      {hotelFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                            <h4 className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center gap-2">
                              <Hotel size={14} /> Stay Hotel #{index + 1}
                            </h4>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => removeHotel(index)}
                                className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                            <Input
                              label="Hotel Name *"
                              placeholder="e.g. Grand Palace Resort & Spa"
                              {...register(`hotels.${index}.name` as any, { required: "Hotel Name required" })}
                            />
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Star Rating
                              </label>
                              <select
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                                {...register(`hotels.${index}.category` as any)}
                              >
                                {HOTEL_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Room Type
                              </label>
                              <select
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                                {...register(`hotels.${index}.roomType` as any)}
                              >
                                {ROOM_TYPES.map((c) => (
                                  <option key={c} value={c}>
                                    {c} Sharing
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                            <Input
                              label="Max Occupants / Room"
                              type="number"
                              {...register(`hotels.${index}.occupancy` as any)}
                            />
                            <Input
                              label="Nights Count"
                              type="number"
                              {...register(`hotels.${index}.nightStayCount` as any)}
                            />
                            <Input
                              label="Hotel Address / Location"
                              placeholder="e.g. Charing Cross, Ooty"
                              {...register(`hotels.${index}.address` as any)}
                            />
                          </div>

                          <MultipleImageUpload
                            label="Hotel Photos & Room Visuals"
                            folder="hotels"
                            values={watch(`hotels.${index}.photos` as any) || []}
                            onChange={(urls) => setValue(`hotels.${index}.photos` as any, urls)}
                          />
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          appendHotel({
                            name: "",
                            category: "3 Star",
                            address: "",
                            mapsLink: "",
                            photos: [],
                            roomType: "Double",
                            occupancy: 2,
                            nightStayCount: 1,
                            notes: "",
                          })
                        }
                        className="py-2 px-4 text-xs font-bold"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Another Stay Hotel
                      </Button>

                      {/* Food Toggles */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                              Food & Meals Included Plan
                            </label>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Toggle if agency arranges meals during the tour.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setValue("foodIncluded", !watch("foodIncluded"))}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                              watch("foodIncluded")
                                ? "bg-teal-500 justify-end"
                                : "bg-slate-300 dark:bg-slate-800 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 bg-white rounded-full shadow" />
                          </button>
                        </div>

                        {watch("foodIncluded") && (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 animate-scale-in">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Select Included Meals:
                            </span>
                            <div className="flex flex-wrap gap-3">
                              {["Breakfast", "Lunch", "Dinner", "Evening Snacks"].map((meal) => {
                                const checked = watchMealsIncluded.includes(meal);
                                return (
                                  <button
                                    key={meal}
                                    type="button"
                                    onClick={() => toggleMeals(meal)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                      checked
                                        ? "bg-teal-500 text-white border-teal-500 shadow-xs"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                                    }`}
                                  >
                                    {checked ? <Check size={12} /> : null}
                                    {meal}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Day-wise Itinerary */}
                  {activeTab === 6 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Step 6: Day-wise Tour Itinerary Timeline
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Build a rich daily timeline with start locations, destinations, activities, and stay notes.
                        </p>
                      </div>

                      {itineraryFields.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic text-xs">
                          No journey days generated. Please set trip departure & return dates in Step 2.
                        </div>
                      ) : (
                        <div className="relative border-l-2 border-teal-500/30 dark:border-teal-900 ml-4 pl-6 space-y-6">
                          {itineraryFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="relative p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
                            >
                              <span className="absolute -left-[37px] top-4 flex items-center justify-center w-7 h-7 rounded-full bg-teal-500 text-white font-black text-xs shadow-md">
                                {index + 1}
                              </span>

                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <h4 className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                                  Day {index + 1} Timeline Details
                                </h4>
                                {watch(`itinerary.${index}.date` as any) && (
                                  <span className="text-xs font-bold text-slate-400">
                                    📅 {watch(`itinerary.${index}.date` as any)}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <Input
                                  label="Start Location *"
                                  placeholder="e.g. Salem / Hotel"
                                  {...register(`itinerary.${index}.startLocation` as any, { required: "Start location required" })}
                                />
                                <Input
                                  label="Reach / Destination *"
                                  placeholder="e.g. Ooty Hilltop"
                                  {...register(`itinerary.${index}.destination` as any, { required: "Destination required" })}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                <Input
                                  label="Departure Time"
                                  type="time"
                                  {...register(`itinerary.${index}.departureTime` as any)}
                                />
                                <Input
                                  label="Arrival Time"
                                  type="time"
                                  {...register(`itinerary.${index}.arrivalTime` as any)}
                                />
                                <Input
                                  label="Night Stay Hotel / Location"
                                  placeholder="e.g. Grand Palace Resort"
                                  {...register(`itinerary.${index}.hotelName` as any)}
                                />
                              </div>

                              <Input
                                label="Day Activities & Notes"
                                placeholder="e.g. Botanical Garden visit, boat ride on Ooty Lake, evening tea tasting"
                                {...register(`itinerary.${index}.notes` as any)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 7: Review & Publish */}
                  {activeTab === 7 && (
                    <div className="space-y-6 animate-fade-in max-h-[600px] overflow-y-auto pr-2">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Step 7: Final Package Review & Publish
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Verify package parameters before making it visible to travelers.
                        </p>
                      </div>

                      <GlassCard strong className="space-y-3 p-5">
                        <h4 className="text-xs font-black text-teal-600 uppercase tracking-wider">Basic Overview</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div><strong>Title:</strong> {watch("title")}</div>
                          <div><strong>Category:</strong> {watch("tripType")} ({watch("category")})</div>
                          <div><strong>Origin:</strong> {watch("originCity")}</div>
                          <div><strong>Destinations:</strong> {watchDestinations.join(", ")}</div>
                          <div><strong>Duration:</strong> {watch("duration")}</div>
                        </div>
                      </GlassCard>

                      <GlassCard strong className="space-y-3 p-5">
                        <h4 className="text-xs font-black text-teal-600 uppercase tracking-wider">Pricing & Capacity</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div><strong>Offer Price:</strong> ₹{watch("offerPrice")} / person</div>
                          <div><strong>Original Price:</strong> ₹{watch("originalPrice")}</div>
                          <div><strong>Seats:</strong> {watch("totalSeats")} Capacity</div>
                          <div><strong>Cancellation:</strong> {watch("cancellationPolicy")}</div>
                        </div>
                      </GlassCard>

                      <GlassCard strong className="space-y-3 p-5">
                        <h4 className="text-xs font-black text-teal-600 uppercase tracking-wider">Transport & Driver</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div><strong>Fleet Type:</strong> {watch("vehicleType")} ({watch("busNumber")})</div>
                          <div><strong>Driver:</strong> {watch("driverName")} ({watch("driverPhone")})</div>
                          <div><strong>Mobile Verified:</strong> {driverMobileVerified ? "✅ Yes" : "❌ Pending"}</div>
                          <div><strong>Email Verified:</strong> {driverEmailVerified ? "✅ Yes" : "❌ Pending"}</div>
                        </div>
                      </GlassCard>
                    </div>
                  )}

                  {/* Stepper Footer Controls */}
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
                    <div>
                      {activeTab > 1 ? (
                        <Button type="button" variant="outline" onClick={handlePrevStep}>
                          <ArrowLeft className="w-4 h-4 mr-2" /> Previous Step
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowTemplateSelector(true)}
                        >
                          <LayoutTemplate className="w-4 h-4 mr-1.5 text-teal-500" /> Switch Template
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {activeTab < 7 ? (
                        <Button type="button" onClick={handleNextStep} className="shadow-brand">
                          Next: {tabItems[activeTab]?.label} <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          loading={createMutation.isPending || updateMutation.isPending}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold shadow-lg py-2.5 px-6"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {editingTripId ? "Update Trip Package" : "Publish Trip Package"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-xl border border-rose-200 font-bold">
                      {submitError}
                    </div>
                  )}
                </form>
              </GlassCard>
            </div>

            {/* Right Column: Sticky Live Preview Panel (30% Desktop) */}
            <div className="lg:col-span-4">
              <TripLivePreview formData={watchAll} activeStep={activeTab} />
            </div>
          </div>
        )
      ) : (
        /* Trips Grid List */
        (() => {
          const displayTrips = trips.filter((t: any) => {
            const status = (t.status || "").toLowerCase();
            const approvalStatus = (t.approvalStatus || "").toLowerCase();

            if (filterTab === "draft") {
              return status === "draft" || approvalStatus === "draft";
            }
            if (filterTab === "pending") {
              return status === "pending_approval" || approvalStatus === "pending" || approvalStatus === "pending_approval";
            }
            if (filterTab === "approved") {
              return status === "published" || status === "approved" || approvalStatus === "approved";
            }
            if (filterTab === "rejected") {
              return status === "rejected" || approvalStatus === "rejected";
            }
            if ((filterTab as string) === "needs_changes") {
              return status.includes("change") || approvalStatus.includes("revision") || approvalStatus.includes("change");
            }
            return true;
          });

          return (
            <div className="space-y-6">
              {/* Filter Tabs Header Bar */}
              <div className="flex gap-2 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800 pb-3 scrollbar-none">
                {[
                  { id: "all", label: "All Packages", count: trips.length },
                  { id: "draft", label: "Drafts", count: trips.filter((t: any) => (t.status || "").toLowerCase() === "draft").length },
                  { id: "pending", label: "Pending Approval", count: trips.filter((t: any) => (t.status || "").toLowerCase() === "pending_approval" || (t.approvalStatus || "").toLowerCase() === "pending").length },
                  { id: "approved", label: "Approved", count: trips.filter((t: any) => (t.status || "").toLowerCase() === "published" || (t.approvalStatus || "").toLowerCase() === "approved").length },
                  { id: "rejected", label: "Rejected", count: trips.filter((t: any) => (t.status || "").toLowerCase() === "rejected" || (t.approvalStatus || "").toLowerCase() === "rejected").length },
                  { id: "needs_changes", label: "Needs Changes", count: trips.filter((t: any) => (t.status || "").toLowerCase().includes("change") || (t.approvalStatus || "").toLowerCase().includes("revision")).length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                      filterTab === tab.id
                        ? "bg-teal-500 text-white shadow-brand scale-102"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      filterTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {displayTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FolderOpen className="w-14 h-14 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    {isProfileCompleted ? `No ${filterTab} trips found` : "Your trips will appear here"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-550 max-w-sm mt-1">
                    {isProfileCompleted
                      ? "Choose a template or create your first group tour!"
                      : "Complete your agent profile first, then create your first group tour."}
                  </p>
                  {isProfileCompleted && (
                    <Button
                      onClick={openCreateMode}
                      className="mt-4 shadow-brand"
                      disabled={slotData ? slotData.usedSlots >= slotData.tripSlots : false}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Host New Trip Now
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayTrips.map((trip: any) => {
                    const hasSaving =
                      trip.originalPrice &&
                      trip.offerPrice &&
                      trip.originalPrice > trip.offerPrice;

                    const isPending = trip.status === "pending_approval" || trip.approvalStatus === "pending";
                    const isApproved = trip.status === "published" || trip.approvalStatus === "approved";
                    const isRejected = trip.status === "rejected" || trip.approvalStatus === "rejected";

                    return (
                      <GlassCard key={trip._id} className="premium-card flex flex-col justify-between p-0 overflow-hidden border border-slate-200/80 dark:border-slate-800">
                        <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800">
                          {trip.coverImage ? (
                            <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-3xl">
                              🏖️
                            </div>
                          )}

                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-black backdrop-blur-md shadow flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-teal-400" />
                            {trip.duration || "Multi-Day"}
                          </div>

                          {/* Status Badge Overlay */}
                          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                            {isApproved ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-full border border-emerald-400 font-extrabold text-[9px] uppercase tracking-wider shadow backdrop-blur-md">
                                  🟢 Published
                                </span>
                                {(trip.publishedAt || trip.approvedAt) && (
                                  <span className="bg-slate-900/90 text-emerald-300 text-[8px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border border-emerald-500/30">
                                    Published: {formatDate(trip.publishedAt || trip.approvedAt)}
                                  </span>
                                )}
                              </div>
                            ) : isRejected ? (
                              <span className="bg-rose-500 text-white px-2.5 py-1 rounded-full border border-rose-400 font-extrabold text-[9px] uppercase tracking-wider shadow backdrop-blur-md">
                                🔴 Rejected
                              </span>
                            ) : isPending ? (
                              <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full border border-amber-400 animate-pulse font-extrabold text-[9px] uppercase tracking-wider shadow backdrop-blur-md">
                                🟡 Pending Admin Approval
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-white px-2.5 py-1 rounded-full border border-slate-700 font-extrabold text-[9px] uppercase tracking-wider shadow backdrop-blur-md">
                                📝 Draft
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 text-xs font-extrabold mb-1">
                              <MapPin size={13} />
                              <span>{trip.originCity || "Origin"} → {trip.destinations?.join(", ") || "Destinations"}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-1">
                              {trip.title}
                            </h3>
                            {trip.tagline && (
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-medium">{trip.tagline}</p>
                            )}
                          </div>

                          {/* Notice Banners */}
                          {isPending && (
                            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 text-amber-800 dark:text-amber-300 text-xs font-medium space-y-1">
                              <p className="font-extrabold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-200">
                                <Clock size={13} className="text-amber-500" /> Submitted For Admin Review
                              </p>
                              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                Your trip has been submitted for review. It will be published after Admin approval.
                              </p>
                            </div>
                          )}

                          {isRejected && (
                            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 text-rose-800 dark:text-rose-300 text-xs font-medium space-y-1">
                              <p className="font-extrabold flex items-center gap-1 text-[11px] uppercase tracking-wider text-rose-900 dark:text-rose-200">
                                <AlertTriangle size={13} className="text-rose-500" /> Revision Required by Admin
                              </p>
                              <p className="text-[11px] text-rose-900 dark:text-rose-100 italic font-semibold">
                                Reason: "{trip.rejectionReason || trip.rejectReason || "Does not comply with policies"}"
                              </p>
                            </div>
                          )}

                          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-teal-500" /> {formatDate(trip.startDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bus className="w-3.5 h-3.5 text-teal-500" /> {trip.vehicleType || "Bus"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Price / Person</span>
                                <div className="flex items-baseline gap-1.5">
                                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                                    ₹{Number(trip.offerPrice || trip.pricePerPerson || 0).toLocaleString("en-IN")}
                                  </h4>
                                  {hasSaving && (
                                    <span className="text-xs text-slate-400 line-through font-semibold">
                                      ₹{Number(trip.originalPrice).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Available Seats</span>
                                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full inline-block mt-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                                  {trip.availableSeats ?? trip.totalSeats} / {trip.totalSeats} seats
                                </span>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              {isApproved ? (
                                <div className="flex-1 text-center py-2 px-2 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200">
                                  ✓ Published Live
                                </div>
                              ) : isPending ? (
                                <div className="flex-1 text-center py-2 px-2 bg-amber-50 text-amber-700 font-extrabold text-xs rounded-xl border border-amber-200 animate-pulse">
                                  🟡 Pending Approval
                                </div>
                              ) : isRejected ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openEditMode(trip)}
                                  className="bg-amber-500 hover:bg-amber-600 text-white flex-1 font-bold text-xs py-2 shadow-xs"
                                >
                                  Edit & Resubmit
                                </Button>
                              ) : (
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
                                className="flex-1 text-xs py-2 font-bold"
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
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()
      )}

      {/* Publish Dialog Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setShowPublishModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
              Publish Trip Package
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
              To publish this trip package and make it visible immediately on the Traveler Portal, please type <strong className="text-slate-900 dark:text-white">PUBLISH</strong> to confirm.
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
              <Button onClick={handlePublishConfirmSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold">
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
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-600">
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
                        onChange={(e) => setTravelerOtpInputs((prev) => ({ ...prev, [b._id]: e.target.value }))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 w-24"
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
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 text-xs font-bold">
              {deleteWizardSuccess}
            </div>
          )}
        </div>
      </Modal>

      {successModal && <SuccessModal {...successModal} />}
    </div>
  );
};

export default Trips;