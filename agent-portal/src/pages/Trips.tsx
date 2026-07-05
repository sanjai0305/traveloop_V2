import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { GlassCard, Button, Input, ImageUploadBox } from "../components/ui";
import { getMyTrips, createTrip, updateTrip, deleteTrip, saveDraft, publishTrip, getMasterData, createMasterEntry } from "../services/tripService";
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
  category: string;
  coverImage: string;
  gallery: string[];
  status: string;

  // Step 2 Route
  pickupLocation: string;
  pickupMapsLink: string;
  originCity: string;
  intermediateStops: string[];
  dropPoint: string;
  dropMapsLink: string;
  destinationCity: string;

  // Step 3 Date & Deadline
  startDate: string;
  departureTime: string;
  endDate: string;
  returnTime: string;
  duration: string;
  deadlineEnabled: boolean;
  deadlineDate: string;
  deadlineTime: string;

  // Step 4 Itinerary
  itinerary: Array<{
    day: number;
    title: string;
    activity: string;
    time: string;
    duration: string;
    destination: string;
    placesCovered: string;
    lunch: string;
    stay: string;
    nightStay: string;
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
  busAmenities: string[];

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

  const kycStatus = agent?.kycStatus || "PENDING";
  const isProfileCompleted = kycStatus === "KYC_COMPLETED" || kycStatus === "APPROVED";

  const { data, isLoading } = useQuery({
    queryKey: ["my-trips"],
    queryFn: getMyTrips,
  });

  const trips = (data as any)?.trips || (Array.isArray(data) ? data : []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<TripFormData>({
    mode: "onChange",
    defaultValues: {
      title: "",
      subtitle: "",
      tagline: "",
      tripType: "Group Tour",
      category: "Budget",
      coverImage: "",
      gallery: [],
      status: "draft",
      pickupLocation: "",
      pickupMapsLink: "",
      originCity: "",
      intermediateStops: [],
      dropPoint: "",
      dropMapsLink: "",
      destinationCity: "",
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
          title: "Day 1 Overview",
          activity: "",
          time: "",
          duration: "",
          destination: "",
          placesCovered: "",
          lunch: "Self Arranged",
          stay: "",
          nightStay: "",
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

  const { fields: itineraryFields, append: appendDay, remove: removeDay } = useFieldArray({
    control,
    name: "itinerary",
  });

  const { fields: hotelFields, append: appendHotel, remove: removeHotel } = useFieldArray({
    control,
    name: "hotels",
  });

  // Watch Form Fields
  const watchCoverImage = watch("coverImage");
  const watchGallery = watch("gallery") || [];
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  const watchDeadlineEnabled = watch("deadlineEnabled");
  const watchDeadlineDate = watch("deadlineDate");
  const watchMealsIncluded = watch("mealsIncluded") || [];
  const watchBusAmenities = watch("busAmenities") || [];
  const watchActivities = watch("activities") || [];
  const watchPackingChecklist = watch("packingChecklist") || [];
  const watchCancellationPolicy = watch("cancellationPolicy");

  // Auto-calculate Duration
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate);
      const end = new Date(watchEndDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = Math.max(0, diffDays - 1);
      if (!isNaN(diffDays) && diffDays > 0) {
        setValue("duration", `${diffDays} Days / ${diffNights} Night${diffNights !== 1 ? "s" : ""}`);
      }
    }
  }, [watchStartDate, watchEndDate, setValue]);

  const openCreateMode = () => {
    if (!isProfileCompleted) {
      alert("Please complete profile verification first");
      return;
    }
    reset();
    setEditingTripId(null);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const openEditMode = (trip: any) => {
    reset({
      ...trip,
      destinationCity: trip.destinations?.[0] || "",
      gstPercentage: trip.gstPercentage || 5,
    });
    setEditingTripId(trip._id);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingTripId(null);
    setMissingFieldsAlert([]);
    setSubmitError(null);
  };

  // Helper to compile payload satisfying backend expectations
  const getPayload = (formData: TripFormData, isDraft: boolean) => {
    const payload: any = {
      ...formData,
      shortDescription: formData.subtitle || formData.tagline || (formData.title ? formData.title.slice(0, 150) : ""),
      destinations: [formData.destinationCity || ""],
      pricePerPerson: Number(formData.offerPrice || 0),
      driverPhone: formData.driverPhone || "",
      emergencyContact: formData.driverPhone || "9988776655", // Pass fallback/driver mobile to satisfy backend
      busType: formData.vehicleType || "Bus",
      status: isDraft ? "draft" : "published",
      itinerary: (formData.itinerary || []).map(item => ({
        ...item,
        description: item.activity || "Sightseeing/Travel",
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
      closeEditor();
      if (resData?.trip) {
        setPublishModalTrip(resData.trip);
        setShowPublishModal(true);
        setPublishConfirmInput("");
      }
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.message || "Failed to create trip");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      closeEditor();
      alert("Trip updated successfully");
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.message || "Failed to update trip");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      alert("Trip deleted successfully");
    }
  });

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

    // ── Hard Validations ──
    const missing: string[] = [];
    if (!formData.coverImage) missing.push("Cover Image is required");
    if (!formData.pickupLocation) missing.push("Pickup Location is required");
    if (!validateGoogleMapsUrl(formData.pickupMapsLink)) missing.push("Valid Pickup Google Maps URL is required");
    if (!formData.dropPoint) missing.push("Drop Point Location is required");
    if (!validateGoogleMapsUrl(formData.dropMapsLink)) missing.push("Valid Drop Point Google Maps URL is required");
    if (formData.totalSeats <= 0) missing.push("Seat Capacity must be greater than 0");
    if (formData.offerPrice > formData.originalPrice) missing.push("Offer Price cannot exceed Original Price");

    // Dates check
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) missing.push("Departure date cannot be after Return date");

    if (formData.deadlineEnabled) {
      if (!formData.deadlineDate) {
        missing.push("Deadline date is required when enabled");
      } else {
        const deadline = new Date(`${formData.deadlineDate}T${formData.deadlineTime || "23:59"}`);
        const departure = new Date(`${formData.startDate}T${formData.departureTime || "00:00"}`);
        if (deadline >= departure) {
          missing.push("Booking deadline must be strictly before Departure Date/Time");
        }
      }
    }

    if (!formData.driverName) missing.push("Driver Name is required");
    if (!formData.driverPhone || !/^[0-9]{10}$/.test(formData.driverPhone)) {
      missing.push("Driver Mobile must be exactly 10 digits");
    }
    if (!formData.driverLicenseNumber) missing.push("Driver License Number is required");
    if (!formData.busNumber) missing.push("Vehicle Bus Number is required");

    if (formData.itinerary.length === 0) missing.push("At least one day in itinerary is required");
    if (formData.hotels.length === 0) missing.push("At least one hotel stay is required");
    
    // Validate hotel photos
    formData.hotels.forEach((h, i) => {
      if (!h.photos || h.photos.length === 0) {
        missing.push(`Hotel ${i + 1} photos are required`);
      }
    });

    if (missing.length > 0) {
      setMissingFieldsAlert(missing);
      return;
    }

    const payload = getPayload(formData, false);

    if (editingTripId) {
      updateMutation.mutate({ id: editingTripId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Stepper buttons handler
  const handleNextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (activeTab === 1) fieldsToValidate = ["title", "tripType", "category", "coverImage"];
    if (activeTab === 2) fieldsToValidate = ["pickupLocation", "pickupMapsLink", "dropPoint", "dropMapsLink", "originCity", "destinationCity"];
    if (activeTab === 3) fieldsToValidate = ["startDate", "departureTime", "endDate", "returnTime"];
    if (activeTab === 6) fieldsToValidate = ["driverName", "driverPhone", "driverLicenseNumber", "busNumber"];
    if (activeTab === 9) fieldsToValidate = ["originalPrice", "offerPrice", "totalSeats"];

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
    const list = watchBusAmenities;
    if (list.includes(amenity)) {
      setValue("busAmenities", list.filter(x => x !== amenity));
    } else {
      setValue("busAmenities", [...list, amenity]);
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

  const tabItems = [
    { step: 1, label: "Basic Info", icon: Info },
    { step: 2, label: "Travel Route", icon: MapPin },
    { step: 3, label: "Date & Deadline", icon: Calendar },
    { step: 4, label: "Itinerary", icon: Compass },
    { step: 5, label: "Hotels & Food", icon: Hotel },
    { step: 6, label: "Transport", icon: Bus },
    { step: 7, label: "Activities", icon: BarChart3 },
    { step: 8, label: "Checklist", icon: ShoppingBag },
    { step: 9, label: "Pricing", icon: IndianRupee },
    { step: 10, label: "Preview", icon: Eye },
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
          <Button onClick={openCreateMode} className="py-2.5">
            <Plus className="w-4 h-4 mr-2" />
            Host New Trip
          </Button>
        )}
      </div>

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
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trip Type *</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500"
                          {...register("tripType")}
                        >
                          {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trip Category *</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500"
                          {...register("category")}
                        >
                          {TRIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <ImageUploadBox
                        label="Cover Image *"
                        folder="covers"
                        value={watchCoverImage}
                        onChange={(url) => setValue("coverImage", url)}
                        error={errors.coverImage?.message}
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

                {/* STEP 2: Travel Route */}
                {activeTab === 2 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Travel Route Planner</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Pickup Point *"
                        placeholder="e.g. Majestic Bus Stand"
                        {...register("pickupLocation", { required: "Pickup Point is required" })}
                        error={errors.pickupLocation?.message}
                      />
                      <Input
                        label="Pickup Google Maps URL *"
                        placeholder="https://maps.app.goo.gl/..."
                        {...register("pickupMapsLink", {
                          required: "Pickup Maps URL is required",
                          validate: (v) => validateGoogleMapsUrl(v) || "Valid Google Maps URL required"
                        })}
                        error={errors.pickupMapsLink?.message}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Departure City *"
                        placeholder="e.g. Bangalore"
                        {...register("originCity", { required: "Departure City is required" })}
                        error={errors.originCity?.message}
                      />
                      <Input
                        label="Destination City *"
                        placeholder="e.g. Salem"
                        {...register("destinationCity", { required: "Destination City is required" })}
                        error={errors.destinationCity?.message}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                      <Input
                        label="Drop Point *"
                        placeholder="e.g. Salem Bus Stand"
                        {...register("dropPoint", { required: "Drop Point is required" })}
                        error={errors.dropPoint?.message}
                      />
                      <Input
                        label="Drop Point Google Maps URL *"
                        placeholder="https://maps.app.goo.gl/..."
                        {...register("dropMapsLink", {
                          required: "Drop Maps URL is required",
                          validate: (v) => validateGoogleMapsUrl(v) || "Valid Google Maps URL required"
                        })}
                        error={errors.dropMapsLink?.message}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Dates & Deadline */}
                {activeTab === 3 && (
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

                {/* STEP 4: Itinerary Builder */}
                {activeTab === 4 && (
                  <div className="space-y-4 animate-page">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Itinerary Builder</h3>
                      <button
                        type="button"
                        onClick={() => appendDay({
                          day: itineraryFields.length + 1,
                          title: `Day ${itineraryFields.length + 1} Overview`,
                          activity: "",
                          time: "",
                          duration: "",
                          destination: "",
                          placesCovered: "",
                          lunch: "Self Arranged",
                          stay: "",
                          nightStay: "",
                        })}
                        className="text-xs font-bold text-teal-500 hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Day
                      </button>
                    </div>

                    {itineraryFields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-teal-500">Day {index + 1} Planning</h4>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => moveDay(index, index - 1)} className="p-1 hover:bg-slate-100 rounded"><ChevronUp size={14} /></button>
                            <button type="button" onClick={() => moveDay(index, index + 1)} className="p-1 hover:bg-slate-100 rounded"><ChevronDown size={14} /></button>
                            {index > 0 && (
                              <button type="button" onClick={() => removeDay(index)} className="p-1 text-rose-500 hover:bg-rose-550 rounded">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Day Title *" {...register(`itinerary.${index}.title` as any)} />
                          <Input label="Departure Location" {...register(`itinerary.${index}.destination` as any)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input label="Departure Time" type="time" {...register(`itinerary.${index}.time` as any)} />
                          <Input label="Duration" placeholder="e.g. 4 Hours" {...register(`itinerary.${index}.duration` as any)} />
                          <Input label="Destination" {...register(`itinerary.${index}.nightStay` as any)} />
                        </div>
                        <Input label="Activity / Sightseeing" placeholder="e.g. Hiking Ooty Peak" {...register(`itinerary.${index}.activity` as any)} />
                        <Input label="Places Covered" placeholder="e.g. Doddabetta Peak, Tea Factory" {...register(`itinerary.${index}.placesCovered` as any)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input label="Lunch arrangements" placeholder="e.g. Self Arranged" {...register(`itinerary.${index}.lunch` as any)} />
                          <Input label="Stay" placeholder="e.g. Hotel ABC" {...register(`itinerary.${index}.stay` as any)} />
                          <Input label="Night Stay City" placeholder="e.g. Ooty" {...register(`itinerary.${index}.nightStay` as any)} />
                        </div>
                      </div>
                    ))}
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
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Transport Configuration</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vehicle Type</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none"
                        {...register("vehicleType")}
                      >
                        {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                      <Input label="Driver Name *" {...register("driverName", { required: "Driver Name required" })} error={errors.driverName?.message} />
                      <Input label="Driver Phone *" maxLength={10} {...register("driverPhone", { required: "Driver Phone required" })} error={errors.driverPhone?.message} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input label="Driver Gmail" type="email" {...register("driverGmail")} />
                      <Input label="License Number *" {...register("driverLicenseNumber", { required: "License required" })} error={errors.driverLicenseNumber?.message} />
                      <Input label="Vehicle Plate Number *" placeholder="e.g. KA-01-MJ-9988" {...register("busNumber", { required: "Vehicle number plate required" })} error={errors.busNumber?.message} />
                    </div>

                    {/* Bus Amenities */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vehicle Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {BUS_AMENITIES_OPTIONS.map((am) => {
                          const has = watchBusAmenities.includes(am);
                          return (
                            <button
                              key={am}
                              type="button"
                              onClick={() => toggleAmenities(am)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                has ? "bg-teal-500 border-teal-500 text-white" : "border-slate-200 text-slate-550 dark:border-slate-800"
                              }`}
                            >
                              {am}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: Activities */}
                {activeTab === 7 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Trip Activities</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ACTIVITIES_OPTIONS.map((act) => {
                        const has = watchActivities.includes(act);
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => toggleActivities(act)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                              has ? "bg-teal-500 border-teal-500 text-white" : "border-slate-200 text-slate-500 dark:border-slate-800"
                            }`}
                          >
                            {act}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 max-w-md">
                      <Input
                        label="Add Custom Activity"
                        placeholder="e.g. Scuba Diving"
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                      />
                      <Button type="button" onClick={addCustomActivity} className="self-end mb-4">
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchActivities.filter(a => !ACTIVITIES_OPTIONS.includes(a)).map((act) => (
                        <span key={act} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {act}
                          <button type="button" onClick={() => toggleActivities(act)} className="text-rose-500 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 8: Packing Checklist */}
                {activeTab === 8 && (
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

                {/* STEP 9: Pricing */}
                {activeTab === 9 && (
                  <div className="space-y-4 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Pricing & Seat Capacities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input label="Original Price (₹) *" type="number" {...register("originalPrice", { required: "Original Price required" })} error={errors.originalPrice?.message} />
                      <Input label="Offer Price (₹) *" type="number" {...register("offerPrice", { required: "Offer Price required" })} error={errors.offerPrice?.message} />
                      <Input label="GST (%)" type="number" {...register("gstPercentage")} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Convenience Fee (₹)" type="number" {...register("convenienceFee")} />
                      <Input label="Seat Capacity *" type="number" {...register("totalSeats", { required: "Seat capacity required" })} error={errors.totalSeats?.message} />
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

                {/* STEP 10: Preview */}
                {activeTab === 10 && (
                  <div className="space-y-6 animate-page">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Package Preview & Submit</h3>
                    
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-250/20 space-y-3 text-xs">
                      <div>
                        <strong>Package Title:</strong> {watch("title")}
                      </div>
                      <div>
                        <strong>Duration:</strong> {watch("duration")}
                      </div>
                      <div>
                        <strong>Dates:</strong> {watch("startDate")} to {watch("endDate")}
                      </div>
                      <div>
                        <strong>Pickup Location:</strong> {watch("pickupLocation")} (Maps verified: {validateGoogleMapsUrl(watch("pickupMapsLink")) ? "Yes" : "No"})
                      </div>
                      <div>
                        <strong>Drop Location:</strong> {watch("dropPoint")} (Maps verified: {validateGoogleMapsUrl(watch("dropMapsLink")) ? "Yes" : "No"})
                      </div>
                      <div>
                        <strong>Total Seats:</strong> {watch("totalSeats")} seats
                      </div>
                      <div>
                        <strong>Offer Price:</strong> ₹{watch("offerPrice")} (Original: ₹{watch("originalPrice")})
                      </div>
                      <div>
                        <strong>Hotels:</strong> {watch("hotels")?.length || 0} Stay(s) configured
                      </div>
                      <div>
                        <strong>Driver details:</strong> {watch("driverName")} ({watch("driverPhone")})
                      </div>
                      <div>
                        <strong>Booking Deadline Status:</strong> {watchDeadlineEnabled ? `Active until ${watchDeadlineDate} ${watch("deadlineTime")}` : "Visible until departure"}
                      </div>
                    </div>
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
                          updateMutation.mutate({ id: editingTripId, data: payload });
                        } else {
                          createMutation.mutate(payload);
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
                {watch("coverImage") ? (
                  <img src={watch("coverImage")} alt={watch("title")} className="w-full h-full object-cover" />
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
                  {watch("category") || "Budget"}
                </div>
              </div>

              <div className="p-5 space-y-3.5">
                <div>
                  <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest block">
                    📍 {watch("destinationCity") || "Ooty"}
                  </span>
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white truncate mt-0.5">
                    {watch("title") || "Untitled Escapade"}
                  </h4>
                  {watch("tagline") && (
                    <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{watch("tagline")}</p>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {watch("startDate") || "Departure Date"}
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
              <Button onClick={openCreateMode} className="mt-4">
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
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-black text-slate-700 shadow flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      {trip.duration}
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
                          onClick={() => {
                            if (confirm("Delete this trip?")) {
                              deleteMutation.mutate(trip._id);
                            }
                          }}
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
    </div>
  );
};

export default Trips;
