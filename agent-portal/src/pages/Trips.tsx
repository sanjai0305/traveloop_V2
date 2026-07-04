// c:/Users/sanja/Trip-Planner-Hackathon/agent-portal/src/pages/Trips.tsx — Complete Redesigned 10-Step Wizard

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import socket from "../services/socket";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Plus, Trash2, Edit2, Calendar, Compass, Bus, IndianRupee, MapPin, Clock,
  Briefcase, AlertTriangle, FolderOpen, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Users, Hotel, Car, Camera, FileText, Tag, BarChart3, CheckCircle, XCircle, Info,
  User, Phone, ShieldCheck, Coffee, ShoppingBag, Eye, Save, Star, ChevronDown, ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { GlassCard, Button, Input, ImageUploadBox, Modal } from "../components/ui";
import {
  getMyTrips, createTrip, updateTrip, deleteTrip, publishTrip,
  saveDraft, requestCancellation, getMasterData, createMasterEntry
} from "../services/tripService";
import { AgentTrip, ItineraryDay } from "../types";
import { formatDate } from "../utils";

// ── Extended Trip form shape covering all new fields ──────────────────────
interface TripFormData extends Partial<AgentTrip> {
  // Step 1
  tagline?: string;
  tripType?: string; // Group Tour, Family Tour, etc.
  coverImage?: string;
  driverGmail?: string;
  galleryImages?: string[];
  thumbnail?: string;
  highlights?: string; // Highlights list text

  // Step 2
  originCity?: string;
  intermediateStops?: string[];
  googleMapsUrl?: string;
  routePreview?: string;
  pickupPoint?: string;
  dropPoint?: string;
  meetingPoint?: string;
  googleLocationUrl?: string;

  // Step 3
  bookingDeadline?: string;
  cancellationDeadline?: string;
  reportingTime?: string;
  allowCancellation?: boolean;
  cancellationUntilDate?: string;
  cancellationUntilTime?: string;
  refundPolicy?: "Fully Refundable" | "Partial Refund" | "Non Refundable";
  cancellationBeforeDays?: number;
  refundPercentage?: number;

  // Step 4
  coDriverName?: string;
  busAmenities?: string[]; // WiFi, Charging, etc.
  busPhotos?: string[];

  // Step 5
  hotelPhotos?: string[];
  hotelAddress?: string;
  hotelMapsLink?: string;
  hotelCategory?: string; // "3 Star" | "4 Star" | "5 Star"
  roomType?: string; // Single, Double, Triple, Family
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  hotelAmenities?: string[]; // Swimming Pool, WiFi, etc.

  // Step 6
  breakfastIncluded?: boolean;
  lunchIncluded?: boolean;
  dinnerIncluded?: boolean;
  mealType?: string[]; // Veg, Non Veg, Buffet
  specialMeals?: string;
  breakfastTiming?: string;
  lunchTiming?: string;
  dinnerTiming?: string;

  // Step 7
  // Handled in itinerary FieldArray

  // Step 8
  selectedActivities?: string[]; // Beach Visit, Cruise, etc.

  // Step 9
  packingRecommendations?: Array<{ item: string; category: "Mandatory" | "Recommended" | "Optional" }>;

  // Step 10
  convenienceFee?: number;
  gst?: number;
  childrenPrice?: number;
  adultPrice?: number;
  bookingLimit?: number;
}

const POPULAR_DESTINATIONS = [
  { name: "Goa", emoji: "🏖️", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300" },
  { name: "Bali", emoji: "🌴", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300" },
  { name: "Tokyo", emoji: "🌸", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300" },
  { name: "Dubai", emoji: "🏙️", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300" },
  { name: "Paris", emoji: "🗼", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300" },
  { name: "Maldives", emoji: "🐚", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=300" },
];

const TRIP_TYPES = [
  "Group Tour",
  "Family Tour",
  "Luxury Tour",
  "Adventure Tour",
  "Pilgrimage",
  "Corporate Tour",
  "Educational Tour",
];

const TRIP_CATEGORIES = ["Premium", "Budget", "Luxury"];

const BUS_TYPES = ["AC Sleeper", "Semi Sleeper", "Volvo", "Mini Bus", "Tempo Traveller"];

const BUS_AMENITIES_OPTIONS = ["WiFi", "Charging", "Blanket", "Water Bottle", "Recliner Seats"];

const HOTEL_CATEGORIES = ["3 Star", "4 Star", "5 Star"];

const ROOM_TYPES = ["Single", "Double", "Triple", "Family"];

const HOTEL_AMENITIES_OPTIONS = ["Swimming Pool", "WiFi", "Gym", "Breakfast", "Parking"];

const MEAL_TYPES = ["Veg", "Non Veg", "Buffet"];

const ACTIVITIES_OPTIONS = [
  "Beach Visit",
  "Cruise",
  "Temple Visit",
  "Shopping",
  "Safari",
  "Campfire",
  "Adventure Sports",
  "Trekking",
  "Boating",
  "Museum",
  "Night Party",
];

const DEFAULT_PACKING_ITEMS = [
  { item: "Identity Card", category: "Mandatory" as const },
  { item: "Passport", category: "Optional" as const },
  { item: "Power Bank", category: "Recommended" as const },
  { item: "Shoes", category: "Mandatory" as const },
  { item: "Medicines", category: "Mandatory" as const },
  { item: "Jacket", category: "Recommended" as const },
  { item: "Raincoat", category: "Optional" as const },
  { item: "Camera", category: "Optional" as const },
  { item: "Torch", category: "Recommended" as const },
  { item: "Cash", category: "Mandatory" as const },
  { item: "Water Bottle", category: "Mandatory" as const },
  { item: "Umbrella", category: "Recommended" as const },
];

export const Trips: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { agent } = useAuthStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCustomDestInput, setShowCustomDestInput] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missingFieldsAlert, setMissingFieldsAlert] = useState<string[]>([]);
  const [customBusType, setCustomBusType] = useState("");
  const [customBusAmenity, setCustomBusAmenity] = useState("");
  const [customHotelAmenity, setCustomHotelAmenity] = useState("");
  const [customActivity, setCustomActivity] = useState("");

  const isProfileCompleted = !!agent?.profileCompleted;

  const { data, isLoading } = useQuery({
    queryKey: ["my-trips"],
    queryFn: getMyTrips,
  });

  const { data: busTypesData } = useQuery({
    queryKey: ["master-bus-types"],
    queryFn: () => getMasterData("bus-types"),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["master-activities"],
    queryFn: () => getMasterData("activities"),
  });

  const { data: hotelAmenitiesData } = useQuery({
    queryKey: ["master-hotel-amenities"],
    queryFn: () => getMasterData("hotel-amenities"),
  });

  const { data: busAmenitiesData } = useQuery({
    queryKey: ["master-bus-amenities"],
    queryFn: () => getMasterData("bus-amenities"),
  });

  const busTypesList = busTypesData?.items?.map(i => i.name) || BUS_TYPES;
  const activitiesList = activitiesData?.items?.map(i => i.name) || ACTIVITIES_OPTIONS;
  const hotelAmenitiesList = hotelAmenitiesData?.items?.map(i => i.name) || HOTEL_AMENITIES_OPTIONS;
  const busAmenitiesList = busAmenitiesData?.items?.map(i => i.name) || BUS_AMENITIES_OPTIONS;

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
      category: "Budget",
      tripType: "Group Tour",
      destinations: [""],
      originCity: "",
      intermediateStops: [],
      duration: "3 Days / 2 Nights",
      startDate: "",
      endDate: "",
      departureTime: "",
      arrivalTime: "",
      pickupLocation: "",
      dropPoint: "",
      meetingPoint: "",
      googleLocationUrl: "",
      allowCancellation: true,
      cancellationUntilDate: "",
      cancellationUntilTime: "18:00",
      refundPolicy: "Fully Refundable",
      busType: "AC Sleeper",
      busNumber: "",
      busAmenities: [],
      driverName: "",
      driverPhone: "",
      driverGmail: "",
      driverLicenseNumber: "",
      emergencyContact: "",
      coDriverName: "",
      hotelName: "",
      hotelAddress: "",
      hotelCategory: "3 Star",
      roomType: "Double",
      hotelAmenities: [],
      breakfastIncluded: false,
      lunchIncluded: false,
      dinnerIncluded: false,
      mealType: [],
      specialMeals: "",
      selectedActivities: [],
      packingRecommendations: DEFAULT_PACKING_ITEMS,
      originalPrice: 5000,
      offerPrice: 4500,
      convenienceFee: 150,
      gst: 5,
      totalSeats: 40,
      availableSeats: 40,
      bookedSeats: 0,
      includedServices: [],
      excludedServices: [],
      termsConditions: "",
      cancellationPolicy: "",
      itinerary: [
        {
          day: 1,
          title: "Day 1 Overview",
          description: "",
          hotel: "",
          morningActivity: "",
          lunch: "",
          eveningActivity: "",
          nightStay: "",
          timings: "",
          attractions: "",
          notes: "",
        } as any,
      ],
    },
  });

  const {
    fields: itineraryFields,
    append: appendDay,
    remove: removeDay,
    insert: insertDay,
  } = useFieldArray({
    control,
    name: "itinerary",
  });

  const watchCoverImage = watch("coverImage");
  const watchAllowCancellation = watch("allowCancellation");
  const watchRefundPolicy = watch("refundPolicy");
  const watchDestinations = watch("destinations") || [];
  const watchSelectedActivities = watch("selectedActivities") || [];
  const watchBusAmenities = watch("busAmenities") || [];
  const watchHotelAmenities = watch("hotelAmenities") || [];
  const watchMealType = watch("mealType") || [];
  const watchPacking = watch("packingRecommendations") || [];
  const watchIncluded = watch("includedServices") || [];
  const watchExcluded = watch("excludedServices") || [];

  // Price calculations
  const originalPriceVal = Number(watch("originalPrice") || 0);
  const offerPriceVal = Number(watch("offerPrice") || 0);
  const autoDiscount = originalPriceVal > offerPriceVal
    ? Math.round(((originalPriceVal - offerPriceVal) / originalPriceVal) * 100)
    : 0;
  const autoSave = Math.max(0, originalPriceVal - offerPriceVal);

  const openCreateMode = () => {
    if (!isProfileCompleted) {
      setProfileModalOpen(true);
      return;
    }
    reset();
    setEditingTripId(null);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const openEditMode = (trip: AgentTrip & TripFormData) => {
    // Format Itinerary Days to split description parts if structured
    const formattedItinerary = (trip.itinerary || []).map((day: any) => {
      const desc = day.description || "";
      const morningMatch = desc.match(/🌅 Morning:\s*(.*)/);
      const lunchMatch = desc.match(/🍽️ Lunch:\s*(.*)/);
      const eveningMatch = desc.match(/🌇 Evening:\s*(.*)/);
      const timingsMatch = desc.match(/⏰ Timings:\s*(.*)/);
      const attractionsMatch = desc.match(/📍 Attractions:\s*(.*)/);
      const notesMatch = desc.match(/📝 Notes:\s*(.*)/);

      return {
        day: day.day,
        title: day.title,
        description: desc,
        hotel: day.hotel || "",
        morningActivity: morningMatch ? morningMatch[1] : "",
        lunch: lunchMatch ? lunchMatch[1] : "",
        eveningActivity: eveningMatch ? eveningMatch[1] : "",
        nightStay: day.hotel || "",
        timings: timingsMatch ? timingsMatch[1] : "",
        attractions: attractionsMatch ? attractionsMatch[1] : "",
        notes: notesMatch ? notesMatch[1] : "",
      };
    });

    reset({
      ...trip,
      itinerary: formattedItinerary as any,
    });
    setEditingTripId(trip._id);
    setEditorOpen(true);
    setActiveTab(1);
  };

  const createMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      setEditorOpen(false);
      reset();
      setSubmitError(null);
      setMissingFieldsAlert([]);
    },
    onError: (err: any) => {
      // Display backend-returned missingFields if available
      const data = err?.response?.data;
      if (data?.missingFields?.length) {
        setMissingFieldsAlert(data.missingFields);
        setSubmitError(data.message || "Trip creation failed.");
      } else {
        setSubmitError(data?.message || err?.message || "Trip creation failed. Please try again.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentTrip> }) => updateTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      setEditorOpen(false);
      reset();
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentTrip> }) => saveDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      setEditorOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: (_, id) => {
      // Optimistically remove the deleted trip from cache to trigger immediate UI re-render
      queryClient.setQueryData(["my-trips"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          trips: (oldData.trips || []).filter((t: any) => t._id !== id),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      alert("Trip deleted successfully");
      try {
        socket.emit("trip_deleted", id);
        console.log("[Socket.io] Emitted trip_deleted for ID:", id);
      } catch (err) {
        console.warn("Failed to emit trip_deleted socket event:", err);
      }
    },
  });

  const moveDayUp = (index: number) => {
    if (index === 0) return;
    const items = [...watch("itinerary") || []];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    // reset days
    items.forEach((item, idx) => {
      item.day = idx + 1;
    });
    setValue("itinerary", items);
  };

  const moveDayDown = (index: number) => {
    const items = [...watch("itinerary") || []];
    if (index === items.length - 1) return;
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    items.forEach((item, idx) => {
      item.day = idx + 1;
    });
    setValue("itinerary", items);
  };

  const resumeDraft = () => {
    if (draftData) {
      reset(draftData.values);
      setEditingTripId(draftData.editingTripId);
      setEditorOpen(true);
      setActiveTab(draftData.activeTab || 1);
      setHasDraft(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("traveloop_agent_trip_draft");
    setHasDraft(false);
    setDraftData(null);
  };

  // Auto-calculate duration and suggest deadlines from dates
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  React.useEffect(() => {
    if (watchStartDate) {
      const parts = watchStartDate.split("-").map(Number);
      const start = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(start.getTime())) {
        // Suggest Booking Deadline: Start Date - 1 day
        const bookingDateObj = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
        const bookingStr = `${bookingDateObj.getFullYear()}-${String(bookingDateObj.getMonth() + 1).padStart(2, "0")}-${String(bookingDateObj.getDate()).padStart(2, "0")}`;
        setValue("bookingDeadline", bookingStr, { shouldValidate: true });

        // Suggest Cancellation Deadline: Start Date - 3 days
        const cancelDateObj = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 3);
        const cancelStr = `${cancelDateObj.getFullYear()}-${String(cancelDateObj.getMonth() + 1).padStart(2, "0")}-${String(cancelDateObj.getDate()).padStart(2, "0")}`;
        setValue("cancellationDeadline", cancelStr, { shouldValidate: true });
        setValue("cancellationUntilDate", cancelStr, { shouldValidate: true });
        setValue("cancellationUntilTime", "18:00", { shouldValidate: true });
      }
    }

    if (watchStartDate && watchEndDate) {
      const startParts = watchStartDate.split("-").map(Number);
      const endParts = watchEndDate.split("-").map(Number);
      const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = Math.max(0, diffDays - 1);
      if (!isNaN(diffDays)) {
        setValue("duration", `${diffDays} Days / ${diffNights} Night${diffNights !== 1 ? "s" : ""}`, { shouldValidate: true });
      }
    }
  }, [watchStartDate, watchEndDate, setValue]);

  // Autosave draft to localStorage
  const formValues = watch();
  React.useEffect(() => {
    if (editorOpen) {
      localStorage.setItem(
        "traveloop_agent_trip_draft",
        JSON.stringify({
          editingTripId,
          values: formValues,
          activeTab,
          savedAt: new Date().toISOString()
        })
      );
    }
  }, [formValues, editorOpen, editingTripId, activeTab]);

  // Load draft on mount/editor state change
  React.useEffect(() => {
    const saved = localStorage.getItem("traveloop_agent_trip_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.values) {
          setHasDraft(true);
          setDraftData(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [editorOpen]);

  // ── Build the final sanitised payload (shared by both Submit and Save Draft)
  const buildFinalPayload = (data: TripFormData, asDraft = false) => {
    const finalItinerary = (data.itinerary || []).map((item) => {
      let descriptionParts: string[] = [];
      const anyData = item as any;
      if (anyData.morningActivity) descriptionParts.push(`🌅 Morning: ${anyData.morningActivity}`);
      if (anyData.lunch)           descriptionParts.push(`🍽️ Lunch: ${anyData.lunch}`);
      if (anyData.eveningActivity) descriptionParts.push(`🌇 Evening: ${anyData.eveningActivity}`);
      if (anyData.timings)         descriptionParts.push(`⏰ Timings: ${anyData.timings}`);
      if (anyData.attractions)     descriptionParts.push(`📍 Attractions: ${anyData.attractions}`);
      if (anyData.notes)           descriptionParts.push(`📝 Notes: ${anyData.notes}`);
      return {
        day: item.day,
        title: item.title || `Day ${item.day}`,
        description: descriptionParts.join("\n") || (item as any).description || "Activity planned.",
        hotel: anyData.nightStay || item.hotel || "",
        images: item.images || [],
      };
    });

    return {
      ...data,
      itinerary: finalItinerary,
      // Ensure shortDescription is always present (backend requires it)
      shortDescription:
        data.subtitle ||
        (data as any).tagline ||
        (data.description ? data.description.slice(0, 150) : ""),
      // Ensure pricePerPerson is always set (backend requires it)
      pricePerPerson: Number(data.offerPrice || data.originalPrice || 0),
      totalSeats: Number(data.totalSeats),
      availableSeats: editingTripId
        ? Number(data.availableSeats)
        : Math.max(0, Number(data.totalSeats) - Number(data.bookedSeats || 0)),
      discountPercentage: autoDiscount,
      saveAmount: autoSave,
      activeStep: activeTab,
      progressPercentage: activeTab * 10,
      ...(asDraft ? { status: "draft" } : {}),
    };
  };

  // ── Frontend pre-submit validation ──────────────────────────────────
  const validateBeforeSubmit = (data: TripFormData): string[] => {
    const missing: string[] = [];
    if (!data.title)                                          missing.push("Trip Name (Step 1)");
    if (!data.description)                                    missing.push("Description (Step 1)");
    if (!data.originCity)                                     missing.push("Origin City (Step 2)");
    if (!data.destinations || !(data.destinations as string[])[0]) missing.push("Destination City (Step 2)");
    if (!data.pickupLocation)                                 missing.push("Pickup Point (Step 2)");
    if (!data.dropPoint)                                      missing.push("Drop Point (Step 2)");
    if (!data.meetingPoint)                                   missing.push("Meeting Point (Step 2)");
    if (!data.googleLocationUrl)                              missing.push("Google Maps URL (Step 2)");
    if (data.googleLocationUrl && !/^https:\/\/(maps\.app\.goo\.gl\/|maps\.google\.com\/|goo\.gl\/maps\/)/.test(data.googleLocationUrl)) {
      missing.push("Valid Google Maps URL (Step 2)");
    }
    if (!data.startDate)                                      missing.push("Start Date (Step 3)");
    if (!data.endDate)                                        missing.push("End Date (Step 3)");
    if (!data.bookingDeadline)                                missing.push("Booking Deadline (Step 3)");
    if (!data.reportingTime)                                  missing.push("Reporting Time (Step 3)");
    if (!data.departureTime)                                  missing.push("Departure Time (Step 3)");
    if (!data.arrivalTime)                                    missing.push("Arrival Time (Step 3)");
    if (!data.busType)                                        missing.push("Bus Type (Step 4)");
    if (!data.busNumber)                                      missing.push("Vehicle Number (Step 4)");
    if (!data.emergencyContact)                               missing.push("Emergency Contact (Step 4)");
    if (!data.totalSeats)                                     missing.push("Max Seats (Step 10)");
    if (!data.offerPrice)                                     missing.push("Offer Price (Step 10)");
    return missing;
  };

  const handleFormSubmit = (data: TripFormData) => {
    setSubmitError(null);
    setMissingFieldsAlert([]);

    // Front-end validation gate
    const missing = validateBeforeSubmit(data);
    if (missing.length > 0) {
      setMissingFieldsAlert(missing);
      return;
    }

    const finalData = buildFinalPayload(data);

    if (editingTripId) {
      updateMutation.mutate({ id: editingTripId, data: finalData as Partial<AgentTrip> });
    } else {
      createMutation.mutate(finalData as Partial<AgentTrip>);
    }

    localStorage.removeItem("traveloop_agent_trip_draft");
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this trip? All booked traveler records for this trip will also be removed!"
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const publishMutation = useMutation({
    mutationFn: publishTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
    },
  });

  const handlePublish = (id: string) => {
    if (
      confirm(
        "Are you sure you want to publish this trip? It will instantly appear on Traveloop Explore for travelers to book!"
      )
    ) {
      publishMutation.mutate(id);
    }
  };

  const toggleInList = (listName: "selectedActivities" | "busAmenities" | "hotelAmenities" | "mealType" | "includedServices" | "excludedServices", value: string) => {
    const current = (watch(listName) as string[]) || [];
    if (current.includes(value)) {
      setValue(listName, current.filter(x => x !== value));
    } else {
      setValue(listName, [...current, value]);
    }
  };

  const addIntermediateStop = () => {
    const current = watch("intermediateStops") || [];
    setValue("intermediateStops", [...current, ""]);
  };

  const removeIntermediateStop = (idx: number) => {
    const current = watch("intermediateStops") || [];
    setValue("intermediateStops", current.filter((_, i) => i !== idx));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    const stops = [...(watch("intermediateStops") || [])];
    const [moved] = stops.splice(sourceIndex, 1);
    stops.splice(targetIndex, 0, moved);
    setValue("intermediateStops", stops, { shouldValidate: true });
  };

  const addCustomPackingItem = () => {
    const itemText = prompt("Enter custom packing item name:");
    if (!itemText) return;
    const current = watch("packingRecommendations") || [];
    setValue("packingRecommendations", [...current, { item: itemText, category: "Recommended" }]);
  };

  const togglePackingStatus = (idx: number, cat: "Mandatory" | "Recommended" | "Optional") => {
    const current = [...(watch("packingRecommendations") || [])];
    current[idx].category = cat;
    setValue("packingRecommendations", current);
  };

  const tabItems = [
    { step: 1, label: "Basic Info", icon: Info },
    { step: 2, label: "Destinations", icon: MapPin },
    { step: 3, label: "Date & Deadlines", icon: Calendar },
    { step: 4, label: "Transport & Driver", icon: Bus },
    { step: 5, label: "Hotel stays", icon: Hotel },
    { step: 6, label: "Meals Plan", icon: Coffee },
    { step: 7, label: "Itinerary Builder", icon: Compass },
    { step: 8, label: "Activities", icon: BarChart3 },
    { step: 9, label: "Packing list", icon: ShoppingBag },
    { step: 10, label: "Pricing & capacity", icon: IndianRupee },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Retrieving trip records...</span>
      </div>
    );
  }

  const trips = data?.trips || [];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Profile Incomplete Banner ── */}
      {!isProfileCompleted && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Complete your profile before creating trips
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Your agent profile must be completed before you can create and publish trips on Traveloop.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/profile")} className="shrink-0">
            Complete Profile
          </Button>
        </div>
      )}

      {/* ── Heading Header ── */}
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
            disabled={!isProfileCompleted}
            title={!isProfileCompleted ? "Complete your profile first" : ""}
          >
            <Plus className="w-4 h-4 mr-2" />
            Host New Trip
          </Button>
        )}
      </div>

      {hasDraft && !editorOpen && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 animate-fade-in">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-teal-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-teal-700 dark:text-teal-400">
                You have an unsaved trip draft
              </p>
              <p className="text-xs text-teal-600 dark:text-teal-500 mt-0.5">
                Would you like to resume editing your last journey?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={discardDraft} className="text-rose-500">
              Discard
            </Button>
            <Button size="sm" onClick={resumeDraft}>
              Resume Draft
            </Button>
          </div>
        </div>
      )}

      {editorOpen ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Editor (8 Cols) */}
          <div className="lg:col-span-8">
            <GlassCard className="p-6">
              {/* Wizard Steps indicator */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.step;
                  return (
                    <button
                      key={tab.step}
                      type="button"
                      onClick={async () => {
                        if (tab.step > activeTab) {
                          let isValid = true;
                          for (let step = activeTab; step < tab.step; step++) {
                            let fields: any[] = [];
                            if (step === 1) fields = ["title", "description"];
                            else if (step === 2) fields = ["originCity", "destinations.0", "pickupLocation", "dropPoint", "meetingPoint", "googleLocationUrl"];
                            else if (step === 3) fields = ["startDate", "endDate", "bookingDeadline", "reportingTime", "departureTime", "arrivalTime"];
                            else if (step === 4) fields = ["busNumber"];
                            else if (step === 10) fields = ["offerPrice", "totalSeats"];
                            if (fields.length > 0) {
                              const stepValid = await trigger(fields);
                              if (!stepValid) {
                                isValid = false;
                                setActiveTab(step);
                                break;
                              }
                            }
                          }
                          if (!isValid) return;
                        }
                        setActiveTab(tab.step);
                      }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? "bg-teal-500 text-white shadow-brand"
                          : "text-slate-400 dark:text-slate-500 hover:text-slate-650"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Bar */}
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

              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* ── STEP 1: Basic Trip Info ── */}
                {activeTab === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Basic Trip Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Trip Name"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Tagline"
                        placeholder="e.g. Journey to the queen of hill stations"
                        {...register("tagline")}
                      />
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trip Type</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 transition-all"
                          {...register("tripType")}
                        >
                          {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trip Category</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 transition-all"
                          {...register("category")}
                        >
                          {TRIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <Input
                        label="Highlights Summary"
                        placeholder="e.g. Scuba diving, Toy Train, Camping"
                        {...register("highlights")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Cover Image URL</label>
                      <ImageUploadBox
                        label="Cover Photo"
                        folder="trips/covers"
                        value={watchCoverImage || ""}
                        onChange={(url) => setValue("coverImage", url)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Description</label>
                      <textarea
                        rows={4}
                        placeholder="Provide detailed description..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm focus:border-teal-500 outline-none transition-all"
                        {...register("description", { required: "Description is required" })}
                      />
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Destination Information ── */}
                {activeTab === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Destination Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Origin City *"
                        placeholder="e.g. Bangalore"
                        helperText="City where travelers begin the trip. Examples: Bangalore, Salem, Chennai, Coimbatore"
                        {...register("originCity", { required: "Origin City is required" })}
                        error={errors.originCity?.message}
                      />
                      <Input
                        label="Destination City *"
                        placeholder="e.g. Ooty"
                        helperText="Final destination of the package. Examples: Ooty, Goa, Manali, Mysore, Yercaud"
                        {...register("destinations.0", { required: "Destination City is required" })}
                        error={(errors.destinations as any)?.[0]?.message}
                      />
                    </div>

                    {/* Intermediate stops */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Intermediate Stops (Optional — Drag & Reorder)
                        </label>
                        <button
                          type="button"
                          onClick={addIntermediateStop}
                          className="text-teal-500 hover:text-teal-650 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus size={14} /> Add Stop
                        </button>
                      </div>
                      {(watch("intermediateStops") || []).map((stop, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, idx)}
                          className="flex gap-2 items-center p-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 cursor-move hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="text-slate-400 select-none px-2 font-bold cursor-grab">☰</div>
                          <div className="flex-1">
                            <Input
                              placeholder={`e.g. Krishnagiri, Dharmapuri, Coonoor (Stop #${idx + 1})`}
                              {...register(`intermediateStops.${idx}` as any)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeIntermediateStop(idx)}
                            className="text-rose-500 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <Input
                        label="Pickup Point *"
                        placeholder="e.g. Silk Board Bus Stop"
                        helperText="Exact location where travelers board. Examples: Silk Board Bus Stop, Salem New Bus Stand, Majestic Metro"
                        {...register("pickupLocation", { required: "Pickup Point is required" })}
                        error={errors.pickupLocation?.message}
                      />
                      <Input
                        label="Drop Point *"
                        placeholder="e.g. Ooty Bus Stand"
                        helperText="Location where travelers will be dropped at the end of the trip. Examples: Ooty Bus Stand, Sterling Resort Entrance"
                        {...register("dropPoint", { required: "Drop Point is required" })}
                        error={errors.dropPoint?.message}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Meeting Point *"
                        placeholder="e.g. Platform 3"
                        helperText="Point where travelers assemble before departure. Examples: Platform 3, Main Gate, Five Roads Junction"
                        {...register("meetingPoint", { required: "Meeting Point is required" })}
                        error={errors.meetingPoint?.message}
                      />
                      <div>
                        <Input
                          label="Google Maps URL *"
                          placeholder="https://maps.app.goo.gl/..."
                          helperText="Google Maps link of departure or main boarding location."
                          {...register("googleLocationUrl", {
                            required: "Valid Google Maps URL required",
                            validate: (val?: string) => {
                              if (!val) return "Valid Google Maps URL required";
                              const isValid = /^https:\/\/(maps\.app\.goo\.gl\/|maps\.google\.com\/|goo\.gl\/maps\/)/.test(val);
                              return isValid || "Valid Google Maps URL required";
                            },
                          })}
                          error={errors.googleLocationUrl?.message}
                        />
                        {/* Maps Actions */}
                        <div className="flex gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const url = watch("googleLocationUrl");
                              if (url && /^https:\/\//.test(url)) window.open(url, "_blank");
                              else alert("Provide a valid Google Maps URL first.");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-600 hover:bg-teal-500 hover:text-white text-[10px] font-bold transition-all"
                          >
                            Open in Maps
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = watch("googleLocationUrl");
                              if (url && /^https:\/\//.test(url)) {
                                window.open(url, "MapsPreview", "width=800,height=600,menubar=no,status=no");
                              } else {
                                alert("Provide a valid Google Maps URL first.");
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white text-[10px] font-bold transition-all"
                          >
                            Preview Location
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = watch("googleLocationUrl");
                              if (url) {
                                navigator.clipboard.writeText(url);
                                alert("Google Maps URL copied to clipboard!");
                              } else {
                                alert("Nothing to copy. Enter a URL first.");
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold transition-all"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Dates & Durations ── */}
                {activeTab === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Trip Dates & Times</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Start Date *"
                        type="date"
                        {...register("startDate", { required: "Start Date is required" })}
                        error={errors.startDate?.message}
                      />
                      <Input
                        label="End Date *"
                        type="date"
                        {...register("endDate", { required: "End Date is required" })}
                        error={errors.endDate?.message}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Duration (Read-only)"
                        readOnly
                        placeholder="Automatically calculated from dates"
                        helperText="Calculated as Days / Nights."
                        {...register("duration")}
                      />
                      <Input
                        label="Booking Deadline *"
                        type="date"
                        helperText="Last date travelers can place reservations. Defaults to Start Date minus 1 day."
                        {...register("bookingDeadline", { required: "Booking Deadline is required" })}
                        error={errors.bookingDeadline?.message}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <Input
                        label="Reporting Time *"
                        type="time"
                        onKeyDown={(e) => e.preventDefault()}
                        helperText="Time travelers should reach the meeting point."
                        {...register("reportingTime", { required: "Reporting Time is required" })}
                        error={errors.reportingTime?.message}
                      />
                      <Input
                        label="Departure Time *"
                        type="time"
                        onKeyDown={(e) => e.preventDefault()}
                        helperText="Bus starts moving."
                        {...register("departureTime", {
                          required: "Departure Time is required",
                          validate: (val, formValues) => {
                            if (!val) return "Departure Time is required";
                            if (formValues.reportingTime && val <= formValues.reportingTime) {
                              return "Departure time must be after reporting time.";
                            }
                            return true;
                          }
                        })}
                        error={errors.departureTime?.message}
                      />
                      <Input
                        label="Arrival Time *"
                        type="time"
                        onKeyDown={(e) => e.preventDefault()}
                        helperText="Expected arrival at destination."
                        {...register("arrivalTime", {
                          required: "Arrival Time is required",
                          validate: (val, formValues) => {
                            if (!val) return "Arrival Time is required";
                            if (formValues.departureTime && val <= formValues.departureTime) {
                              return "Arrival time cannot be earlier than departure.";
                            }
                            return true;
                          }
                        })}
                        error={errors.arrivalTime?.message}
                      />
                    </div>

                    {/* Cancellation Window */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Allow Cancellation
                          </label>
                          <p className="text-[10px] text-slate-400">Can travelers request refund cancellation?</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setValue("allowCancellation", true, { shouldValidate: true })}
                            className={`px-3 py-1 text-xs font-extrabold rounded-lg border transition-all ${
                              watchAllowCancellation
                                ? "bg-teal-500 border-teal-500 text-white shadow-brand"
                                : "border-slate-200 text-slate-400 dark:border-slate-800"
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue("allowCancellation", false, { shouldValidate: true })}
                            className={`px-3 py-1 text-xs font-extrabold rounded-lg border transition-all ${
                              !watchAllowCancellation
                                ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                                : "border-slate-200 text-slate-400 dark:border-slate-800"
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {watchAllowCancellation && (
                        <div className="space-y-4 animate-fade-in">
                          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                            Cancellation Window *
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Cancellation Until Date *"
                              type="date"
                              {...register("cancellationUntilDate", {
                                required: watchAllowCancellation ? "Cancellation Until Date is required" : false
                              })}
                              error={errors.cancellationUntilDate?.message}
                            />
                            <Input
                              label="Cancellation Until Time *"
                              type="time"
                              onKeyDown={(e) => e.preventDefault()}
                              {...register("cancellationUntilTime", {
                                required: watchAllowCancellation ? "Cancellation Until Time is required" : false
                              })}
                              error={errors.cancellationUntilTime?.message}
                              helperText="Travelers can cancel bookings until this exact date and time."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                              Refund Policy
                              <span className="text-rose-500 font-extrabold ml-1.5 text-[14px] leading-none">*</span>
                            </label>
                            <select
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 transition-all font-bold"
                              {...register("refundPolicy")}
                            >
                              <option value="Fully Refundable">Fully Refundable</option>
                              <option value="Partial Refund">Partial Refund</option>
                              <option value="Non Refundable">Non Refundable</option>
                            </select>
                          </div>

                          {watchRefundPolicy === "Partial Refund" && (
                            <div className="p-4 rounded-2xl bg-amber-50/20 border border-amber-200/40 text-xs space-y-2">
                              <h5 className="font-extrabold text-slate-700 dark:text-slate-350 uppercase text-[10px] tracking-wider mb-1">
                                Suggested Partial Refund Scheme
                              </h5>
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b pb-1 border-slate-150">
                                    <th className="pb-1.5">Cancellation Before</th>
                                    <th className="pb-1.5 text-right">Refund %</th>
                                  </tr>
                                </thead>
                                <tbody className="font-semibold text-slate-600 dark:text-slate-350">
                                  <tr className="border-b border-slate-100 dark:border-slate-850">
                                    <td className="py-1.5">7 days before departure</td>
                                    <td className="py-1.5 text-right text-emerald-500 font-bold">100%</td>
                                  </tr>
                                  <tr className="border-b border-slate-100 dark:border-slate-850">
                                    <td className="py-1.5">3 days before departure</td>
                                    <td className="py-1.5 text-right text-teal-500 font-bold">75%</td>
                                  </tr>
                                  <tr className="border-b border-slate-100 dark:border-slate-850">
                                    <td className="py-1.5">24 hours before departure</td>
                                    <td className="py-1.5 text-right text-amber-500 font-bold">50%</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1.5">After deadline passes</td>
                                    <td className="py-1.5 text-right text-rose-500 font-bold">0%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Transport & Driver Details ── */}
                {activeTab === 4 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Transport & Driver</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
                          Bus Type
                          <span className="text-rose-500 font-extrabold ml-1.5 text-[14px] leading-none">*</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 transition-all font-bold"
                            {...register("busType", { required: "Bus Type is required" })}
                          >
                            {busTypesList.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <input
                            type="text"
                            placeholder="Add Custom"
                            value={customBusType}
                            onChange={(e) => setCustomBusType(e.target.value)}
                            className="w-32 px-3 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 outline-none font-bold"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={async () => {
                              if (customBusType.trim()) {
                                const name = customBusType.trim();
                                const res = await createMasterEntry("bus-types", name);
                                if (res.success) {
                                  setValue("busType", name, { shouldValidate: true });
                                  setCustomBusType("");
                                  queryClient.invalidateQueries({ queryKey: ["master-bus-types"] });
                                }
                              }
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <Input
                        label="Vehicle Number *"
                        placeholder="e.g. KA-01-MJ-9988"
                        {...register("busNumber", { required: "Vehicle Number is required" })}
                        error={errors.busNumber?.message}
                      />
                    </div>

                    {/* Bus amenities */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Bus Amenities</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {busAmenitiesList.map(opt => {
                          const has = watchBusAmenities.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleInList("busAmenities", opt)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                has
                                  ? "bg-teal-500 border-teal-500 text-white"
                                  : "border-slate-200 text-slate-500 dark:border-slate-800"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 max-w-sm">
                        <input
                          type="text"
                          placeholder="New Bus Amenity (e.g. WiFi)"
                          value={customBusAmenity}
                          onChange={(e) => setCustomBusAmenity(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 outline-none font-bold"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            if (customBusAmenity.trim()) {
                              const name = customBusAmenity.trim();
                              const res = await createMasterEntry("bus-amenities", name);
                              if (res.success) {
                                toggleInList("busAmenities", name);
                                setCustomBusAmenity("");
                                queryClient.invalidateQueries({ queryKey: ["master-bus-amenities"] });
                              }
                            }
                          }}
                        >
                          + Add
                        </Button>
                      </div>
                    </div>

                    {/* Driver details */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Assign Driver</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Driver Name *"
                          placeholder="Ramesh Kumar"
                          {...register("driverName", { required: "Driver Assignment is required" })}
                          error={errors.driverName?.message}
                        />
                        <Input
                          label="Driver Gmail (OTP login) *"
                          type="email"
                          placeholder="ramesh@gmail.com"
                          {...register("driverGmail", { required: "Driver Gmail is required" })}
                          error={errors.driverGmail?.message}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Driver Mobile Number"
                          placeholder="9876543210"
                          {...register("driverPhone")}
                        />
                        <Input
                          label="License Number"
                          placeholder="DL-14202100874"
                          {...register("driverLicenseNumber")}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Emergency Contact *"
                          placeholder="Emergency alternate number"
                          {...register("emergencyContact", { required: "Emergency Contact is required" })}
                          error={errors.emergencyContact?.message}
                        />
                        <Input
                          label="Co-Driver Name (Optional)"
                          placeholder="Suresh Kumar"
                          {...register("coDriverName")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: Accommodation Details ── */}
                {activeTab === 5 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Hotel & Stays</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Hotel Name"
                        placeholder="e.g. Grand Palace Resort"
                        {...register("hotelName")}
                      />
                      <Input
                        label="Hotel Address"
                        placeholder="e.g. 12/B Mountain Road, Ooty"
                        {...register("hotelAddress")}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hotel Category</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 transition-all"
                          {...register("hotelCategory")}
                        >
                          {HOTEL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Room Type</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 transition-all"
                          {...register("roomType")}
                        >
                          {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Google Maps Address Link"
                        placeholder="https://maps.google.com/..."
                        {...register("hotelMapsLink")}
                      />
                      <div className="flex gap-2">
                        <Input
                          label="Check In Time"
                          placeholder="e.g. 12:00 PM"
                          {...register("hotelCheckIn")}
                        />
                        <Input
                          label="Check Out Time"
                          placeholder="e.g. 11:00 AM"
                          {...register("hotelCheckOut")}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Hotel Amenities</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {hotelAmenitiesList.map(opt => {
                          const has = watchHotelAmenities.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleInList("hotelAmenities", opt)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                has
                                  ? "bg-teal-500 border-teal-500 text-white"
                                  : "border-slate-200 text-slate-500 dark:border-slate-800"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 max-w-sm">
                        <input
                          type="text"
                          placeholder="New Hotel Amenity (e.g. Spa)"
                          value={customHotelAmenity}
                          onChange={(e) => setCustomHotelAmenity(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 outline-none font-bold"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            if (customHotelAmenity.trim()) {
                              const name = customHotelAmenity.trim();
                              const res = await createMasterEntry("hotel-amenities", name);
                              if (res.success) {
                                toggleInList("hotelAmenities", name);
                                setCustomHotelAmenity("");
                                queryClient.invalidateQueries({ queryKey: ["master-hotel-amenities"] });
                              }
                            }
                          }}
                        >
                          + Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 6 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Meal Inclusions</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { name: "breakfastIncluded", label: "🍳 Breakfast" },
                        { name: "lunchIncluded",     label: "🍽️ Lunch" },
                        { name: "dinnerIncluded",    label: "🌙 Dinner" },
                      ].map(meal => (
                        <label key={meal.name} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-55/30 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded text-teal-500 border-slate-300 focus:ring-teal-500 w-4 h-4"
                            {...register(meal.name as any)}
                          />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{meal.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Meal Type Options</label>
                        <div className="flex gap-2">
                          {MEAL_TYPES.map(m => {
                            const has = watchMealType.includes(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => toggleInList("mealType", m)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                                  has ? "bg-teal-500 border-teal-500 text-white" : "border-slate-200 text-slate-500 dark:border-slate-800"
                                }`}
                              >
                                {m}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Input
                        label="Special Meals / Food notes"
                        placeholder="e.g. Jain food available, buffet setup"
                        {...register("specialMeals")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Breakfast Timing"
                        placeholder="e.g. 08:00 AM - 09:30 AM"
                        {...register("breakfastTiming")}
                      />
                      <Input
                        label="Lunch Timing"
                        placeholder="e.g. 01:00 PM - 02:30 PM"
                        {...register("lunchTiming")}
                      />
                      <Input
                        label="Dinner Timing"
                        placeholder="e.g. 08:30 PM - 10:00 PM"
                        {...register("dinnerTiming")}
                      />
                    </div>
                  </div>
                )}

                {/* ── STEP 7: Detailed Itinerary Builder ── */}
                {activeTab === 7 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Itinerary Days ({itineraryFields.length})</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          appendDay({
                            day: itineraryFields.length + 1,
                            title: `Day ${itineraryFields.length + 1} Overview`,
                            description: "",
                            hotel: "",
                            morningActivity: "",
                            lunch: "",
                            eveningActivity: "",
                            nightStay: "",
                            timings: "",
                            attractions: "",
                            notes: "",
                          } as any)
                        }
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Day
                      </Button>
                    </div>

                    <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2 scrollbar-none">
                      {itineraryFields.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-900/30 border border-slate-105 dark:border-slate-800 space-y-4 shadow-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-[10px] uppercase rounded-full">
                              Day {idx + 1}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {idx > 0 && (
                                <button type="button" onClick={() => moveDayUp(idx)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {idx < itineraryFields.length - 1 && (
                                <button type="button" onClick={() => moveDayDown(idx)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {itineraryFields.length > 1 && (
                                <button type="button" onClick={() => removeDay(idx)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="hidden" {...register(`itinerary.${idx}.day` as const)} value={idx + 1} />
                            <Input
                              label="Day Theme / Title"
                              placeholder="e.g. Arrival & Sightseeing"
                              {...register(`itinerary.${idx}.title` as const, { required: "Day title required" })}
                            />
                            <Input
                              label="Overnight Hotel Stay"
                              placeholder="e.g. Grand Palace Hotel"
                              {...register(`itinerary.${idx}.nightStay` as any)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="🌅 Morning Activity"
                              placeholder="Reporting/Trek"
                              {...register(`itinerary.${idx}.morningActivity` as any)}
                            />
                            <Input
                              label="🍽️ Lunch Setup"
                              placeholder="Local Lunch"
                              {...register(`itinerary.${idx}.lunch` as any)}
                            />
                            <Input
                              label="🌇 Evening Activity"
                              placeholder="Sightseeing"
                              {...register(`itinerary.${idx}.eveningActivity` as any)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="⏰ Timings"
                              placeholder="06:30 AM - 09:30 PM"
                              {...register(`itinerary.${idx}.timings` as any)}
                            />
                            <Input
                              label="📍 Attractions"
                              placeholder="Doddabetta Peak, Lakes"
                              {...register(`itinerary.${idx}.attractions` as any)}
                            />
                            <Input
                              label="📝 Notes"
                              placeholder="Carry warm clothes"
                              {...register(`itinerary.${idx}.notes` as any)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 8: Activities Selection ── */}
                {activeTab === 8 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-base">🏂 Trip Activities</h3>
                        <p className="text-slate-400 text-xs font-semibold">Select all major activities included in this travel package.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {activitiesList.map(act => {
                        const isSelected = watchSelectedActivities.includes(act);
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => toggleInList("selectedActivities", act)}
                            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 font-bold text-xs ${
                              isSelected
                                ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                                : "border-slate-100 dark:border-slate-800 bg-slate-50/20 text-slate-500"
                            }`}
                          >
                            <span>🏂</span>
                            <span>{act}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 max-w-sm pt-2 border-t border-slate-100 dark:border-slate-850">
                      <input
                        type="text"
                        placeholder="Add Custom Activity (e.g. Ziplining)"
                        value={customActivity}
                        onChange={(e) => setCustomActivity(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 outline-none font-bold"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          if (customActivity.trim()) {
                            const name = customActivity.trim();
                            const res = await createMasterEntry("activities", name);
                            if (res.success) {
                              toggleInList("selectedActivities", name);
                              setCustomActivity("");
                              queryClient.invalidateQueries({ queryKey: ["master-activities"] });
                            }
                          }
                        }}
                      >
                        + Add Activity
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── STEP 9: Packing Recommendations ── */}
                {activeTab === 9 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base">🎒 Packing Checklist</h3>
                      <button type="button" onClick={addCustomPackingItem} className="text-teal-500 text-xs font-bold flex items-center gap-1">
                        <Plus size={14} /> Add Item
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-none">
                      {watchPacking.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 border border-slate-105 dark:border-slate-800">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-350">{p.item}</span>
                          <div className="flex gap-1.5">
                            {["Mandatory", "Recommended", "Optional"].map((cat: any) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => togglePackingStatus(i, cat)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  p.category === cat
                                    ? "bg-teal-550 text-white"
                                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 10: Pricing & Capacities ── */}
                {activeTab === 10 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">💰 Pricing & Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Original Price (₹)"
                        type="number"
                        {...register("originalPrice")}
                      />
                      <Input
                        label="Offer Price (₹) *"
                        type="number"
                        {...register("offerPrice", { required: "Offer Price is required" })}
                        error={errors.offerPrice?.message}
                      />
                      <Input
                        label="GST Rate (%)"
                        type="number"
                        {...register("gst")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Convenience Fee (₹)"
                        type="number"
                        {...register("convenienceFee")}
                      />
                      <Input
                        label="Seat Capacity *"
                        type="number"
                        {...register("totalSeats", { required: "Seat Capacity is required" })}
                        error={errors.totalSeats?.message}
                      />
                    </div>

                    {/* Exclusions / Policies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <Input
                        label="Cancellation Policy"
                        placeholder="e.g. Full refund 48h before trip"
                        {...register("cancellationPolicy")}
                      />
                      <Input
                        label="Refund Policy / Terms"
                        placeholder="e.g. 50% refund within 24h"
                        {...register("refundPolicy")}
                      />
                      {submitError && (
                        <div className="col-span-full p-3 text-xs bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                          {submitError}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Wizard Navigation Footer */}
                <div className="flex justify-between border-t border-slate-150 dark:border-slate-800 pt-6 mt-8">
                  <div className="flex gap-2">
                    {activeTab > 1 ? (
                      <Button type="button" variant="outline" onClick={() => setActiveTab(activeTab - 1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const payload = buildFinalPayload(watch() as TripFormData, true);
                        if (editingTripId) {
                          saveDraftMutation.mutate({ id: editingTripId, data: payload as Partial<AgentTrip> });
                        } else {
                          createMutation.mutate(payload as Partial<AgentTrip>);
                        }
                        localStorage.removeItem("traveloop_agent_trip_draft");
                      }}
                      loading={createMutation.isPending || saveDraftMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-1.5" /> Save Draft
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="lg:hidden"
                      onClick={() => setShowPreviewModal(true)}
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Preview
                    </Button>

                    {activeTab < 10 ? (
                      <Button
                        type="button"
                        onClick={async () => {
                          let fields: any[] = [];
                          if (activeTab === 1) fields = ["title", "description"];
                          else if (activeTab === 2) fields = ["originCity", "destinations.0", "pickupLocation", "dropPoint", "meetingPoint", "googleLocationUrl"];
                          else if (activeTab === 3) fields = ["startDate", "endDate", "bookingDeadline", "reportingTime", "departureTime", "arrivalTime"];
                          else if (activeTab === 4) fields = ["busNumber"];
                          else if (activeTab === 10) fields = ["offerPrice", "totalSeats"];
                          
                          if (fields.length > 0) {
                            const isStepValid = await trigger(fields);
                            if (!isStepValid) return;
                          }
                          setActiveTab(activeTab + 1);
                        }}
                      >
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        {editingTripId ? "Save Trip" : "Create Trip"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Missing fields alert */}
                {missingFieldsAlert.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/40">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-2">
                      ⚠️ Please complete these required fields before submitting:
                    </p>
                    <ul className="space-y-1">
                      {missingFieldsAlert.map((f, i) => (
                        <li key={i} className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            </GlassCard>
          </div>

          {/* Right Column: Live Preview Panel */}
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Live Package Preview</span>
            <div className="rounded-3xl border border-slate-150 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden shadow-md">
              {/* Cover */}
              <div className="relative h-44 w-full bg-slate-100">
                {watch("coverImage") ? (
                  <img src={watch("coverImage")} alt={watch("title")} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-black">
                    🏖️
                  </div>
                )}
                {/* DRAFT Overlay */}
                {(!editingTripId || watch("status") === "draft") && (
                  <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black tracking-widest shadow-lg uppercase">
                      Draft Preview
                    </span>
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

              {/* Info */}
              <div className="p-5 space-y-3.5">
                <div>
                  <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest block">
                    📍 {watch("destinations.0") || "Ooty"}
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
                    {watch("startDate") || "Date"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus size={13} />
                    {watch("busType") || "AC Sleeper"}
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
        /* ── Trips Grid List ── */
        trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-14 h-14 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {isProfileCompleted ? "No Hosted Trips Found" : "Your trips will appear here"}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
              {isProfileCompleted
                ? "You haven't listed any tours. Create your first group tour and display it on Traveloop!"
                : "Complete your agent profile first, then create your first group tour."}
            </p>
            {isProfileCompleted ? (
              <Button onClick={openCreateMode} className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> Create Trip Now
              </Button>
            ) : (
              <Button onClick={() => navigate("/profile")} className="mt-4">
                <User className="w-4 h-4 mr-2" /> Complete Profile
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: AgentTrip & TripFormData) => {
              const hasSaving = trip.originalPrice && trip.offerPrice && trip.originalPrice > trip.offerPrice;
              const publishBadge = {
                draft: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500", label: "Draft" },
                pending: { bg: "bg-amber-50 dark:bg-amber-955/20", text: "text-amber-600", label: "Pending" },
                published: { bg: "bg-emerald-50 dark:bg-emerald-955/20", text: "text-emerald-600", label: "Published" },
                closed: { bg: "bg-rose-50 dark:bg-rose-955/20", text: "text-rose-600", label: "Closed" },
                completed: { bg: "bg-blue-50 dark:bg-blue-955/20", text: "text-blue-600", label: "Completed" },
              };
              const statusKey = trip.status || trip.publishStatus || "draft";
              const status = publishBadge[(statusKey as keyof typeof publishBadge)] || publishBadge.draft;

              return (
                <GlassCard key={trip._id} className="premium-card flex flex-col justify-between p-0 overflow-hidden">
                  {/* Cover */}
                  <div className="relative h-44 w-full bg-slate-100">
                    {trip.coverImage ? (
                       <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-3xl">
                        ✈️
                      </div>
                    )}
                    {statusKey === "draft" && (
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
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}>
                      {status.label}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {(trip.destinations || []).map((d, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
                            {d}
                          </span>
                        ))}
                        {trip.category && (
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-[9px] font-bold text-teal-500">
                            {trip.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 leading-snug line-clamp-1">
                        {trip.title}
                      </h3>
                      {trip.subtitle && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{trip.subtitle}</p>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(trip.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bus className="w-3.5 h-3.5 text-slate-400" /> {trip.busType || "Bus"}
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
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                            trip.availableSeats <= 5 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {trip.availableSeats} / {trip.totalSeats} left
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                        {statusKey === "draft" && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={trip.progressPercentage !== undefined && trip.progressPercentage !== 100}
                            onClick={() => handlePublish(trip._id)}
                            className={`${
                              trip.progressPercentage === undefined || trip.progressPercentage === 100
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-400 dark:bg-slate-800 cursor-not-allowed"
                            } flex-1 font-bold text-xs py-2`}
                            loading={publishMutation.isPending}
                            title={trip.progressPercentage === undefined || trip.progressPercentage === 100 ? "Publish Trip" : `Cannot publish. Trip progress is only ${trip.progressPercentage}%. Complete all steps first.`}
                          >
                            Publish
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openEditMode(trip as AgentTrip)} className={statusKey === "draft" ? "" : "flex-1"}>
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                        </Button>
                        <button onClick={() => handleDelete(trip._id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg ml-auto">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )
      )}

      {/* Mobile Preview Modal */}
      {showPreviewModal && (
        <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Package Preview">
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-black text-slate-850">Preview</h3>
            <div className="rounded-2xl border border-slate-150 overflow-hidden bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">{watch("title") || "Untitled trip"}</h4>
              <p className="text-xs text-slate-500">{watch("description")}</p>
            </div>
            <Button className="w-full" onClick={() => setShowPreviewModal(false)}>Close Preview</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Trips;
