// src/pages/EditTrip.jsx — Full-page Trip Edit Experience (Desktop-first SaaS design)

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, CalendarDays, DollarSign, Image, Globe,
  Eye, EyeOff, Lock, Save, AlertTriangle, CheckCircle,
  Loader2, X, Upload, Trash2, Tag, Users, Pencil, Info,
  Camera, RefreshCw
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "planning",  label: "Planning",  color: "#8B5CF6", desc: "Trip is being organized" },
  { value: "upcoming",  label: "Upcoming",  color: "#3B82F6", desc: "Trip is confirmed & coming up" },
  { value: "ongoing",   label: "Ongoing",   color: "#10B981", desc: "Trip is currently happening" },
  { value: "completed", label: "Completed", color: "#6B7280", desc: "Trip has finished" },
  { value: "cancelled", label: "Cancelled", color: "#EF4444", desc: "Trip was cancelled" },
];

const VISIBILITY_OPTIONS = [
  { value: "private",  label: "Private",  Icon: Lock,  desc: "Only you can see this trip",     color: "#6B7280" },
  { value: "public",   label: "Public",   Icon: Globe, desc: "Anyone with the link can view",  color: "#10B981" },
];

const TRAVEL_TYPES = [
  "Adventure", "Relaxation", "Cultural", "Food & Drink", "Romantic",
  "Family", "Solo", "Friends", "Luxury", "Backpacking", "Business", "Road Trip"
];

const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: format date for <input type="date">
// ─────────────────────────────────────────────────────────────────────────────
const toInputDate = (val) => {
  if (!val) return "";
  try {
    return new Date(val).toISOString().split("T")[0];
  } catch {
    return typeof val === "string" ? val.split("T")[0] : "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIELD COMPONENT — clean input wrapper
// ─────────────────────────────────────────────────────────────────────────────
const Field = ({ label, required, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
      {label}
      {required && <span className="text-rose-500 text-xs">*</span>}
      {hint && (
        <span className="ml-auto text-xs font-medium text-slate-400 flex items-center gap-1">
          <Info size={11} /> {hint}
        </span>
      )}
    </label>
    {children}
    {error && (
      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
        <AlertTriangle size={12} /> {error}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const EditTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [errors,  setErrors]    = useState({});
  const [isDirty, setIsDirty]   = useState(false);

  const [form, setForm] = useState({
    title:           "",
    destination:     "",
    startDate:       "",
    endDate:         "",
    budget:          "",
    currency:        "INR",
    description:     "",
    travelType:      "",
    status:          "planning",
    isPublic:        false,
    image:           "",
    tags:            [],
    maxMembers:      "",
  });

  const [tagInput, setTagInput]   = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageMode, setImageMode] = useState("url"); // "url" | "upload"

  // ── FETCH TRIP DATA ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`trips/${tripId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          console.error("[EditTrip] Fetch failed:", data);
          toast.error(data.message || "Failed to load trip data");
          navigate("/my-trips");
          return;
        }

        const t = data.trip;
        console.log("[EditTrip] Loaded trip:", t);

        setForm({
          title:       t.title        || "",
          destination: t.destination  || t.destinationName || "",
          startDate:   toInputDate(t.startDate),
          endDate:     toInputDate(t.endDate),
          budget:      t.budget       != null ? String(t.budget) : "",
          currency:    t.currency     || "INR",
          description: t.description  || "",
          travelType:  t.travelType   || t.style || "",
          status:      t.status       || "planning",
          isPublic:    t.isPublic     || false,
          image:       t.image        || "",
          tags:        Array.isArray(t.tags) ? t.tags : [],
          maxMembers:  t.maxMembers   != null ? String(t.maxMembers) : "",
        });
        setImagePreview(t.image || "");
      } catch (err) {
        console.error("[EditTrip] Exception:", err);
        toast.error("Network error while loading trip");
        navigate("/my-trips");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CHANGE HELPERS ─────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
    setIsDirty(true);
  };

  // ── TAG HELPERS ────────────────────────────────────────────────────────────
  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag) || form.tags.length >= 10) return;
    handleChange("tags", [...form.tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag) => {
    handleChange("tags", form.tags.filter(t => t !== tag));
  };

  // ── IMAGE URL ──────────────────────────────────────────────────────────────
  const handleImageUrl = (url) => {
    handleChange("image", url);
    setImagePreview(url);
  };

  const clearImage = () => {
    handleChange("image", "");
    setImagePreview("");
  };

  // ── VALIDATION ─────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Trip name is required";
    }
    if (!form.destination.trim()) {
      newErrors.destination = "Destination is required";
    }
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    if (form.budget !== "" && Number(form.budget) < 0) {
      newErrors.budget = "Budget cannot be negative";
    }
    if (form.budget !== "" && Number(form.budget) > 100000000) {
      newErrors.budget = "Budget is unrealistically large";
    }
    if (form.maxMembers !== "" && Number(form.maxMembers) < 1) {
      newErrors.maxMembers = "Must allow at least 1 member";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── SAVE ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the validation errors");
      return;
    }

    const payload = {
      title:       form.title.trim(),
      destination: form.destination.trim(),
      startDate:   form.startDate  || null,
      endDate:     form.endDate    || null,
      budget:      form.budget !== "" ? Number(form.budget) : undefined,
      currency:    form.currency,
      description: form.description.trim(),
      travelType:  form.travelType,
      status:      form.status,
      isPublic:    form.isPublic,
      image:       form.image,
      tags:        form.tags,
      maxMembers:  form.maxMembers !== "" ? Number(form.maxMembers) : undefined,
    };

    console.log("[EditTrip] Saving — tripId:", tripId, "payload:", payload);

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}`), {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("[EditTrip] Save response:", res.status, data);

      if (!res.ok || !data.success) {
        console.error("[EditTrip] Save failed:", data);
        toast.error(data.message || "Failed to save trip");
        return;
      }

      toast.success("Trip updated successfully! 🎉");
      setIsDirty(false);

      // Redirect back to the itinerary dashboard
      setTimeout(() => {
        navigate(`/build-itinerary/${tripId}`);
      }, 600);
    } catch (err) {
      console.error("[EditTrip] Save exception:", err);
      toast.error("Network error while saving trip");
    } finally {
      setSaving(false);
    }
  };

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    navigate(`/build-itinerary/${tripId}`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse shadow-lg shadow-cyan-500/20">
              <Loader2 size={22} className="text-white animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-black text-slate-800">Loading trip data…</p>
              <p className="text-xs text-slate-500 mt-0.5">Fetching your trip details</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const selectedCurrency = CURRENCY_OPTIONS.find(c => c.code === form.currency) || CURRENCY_OPTIONS[0];
  const tripDays = form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate)
    ? Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000))
    : null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F7FAFC]">

        {/* ── STICKY TOP HEADER ─────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            
            {/* Back + Trip Info */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={handleCancel}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer shrink-0"
                aria-label="Back to trip"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-100 px-2.5 py-0.5 rounded-full">
                    <Pencil size={10} /> Edit Mode
                  </span>
                  {isDirty && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                      Unsaved changes
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-black text-slate-900 truncate mt-0.5">
                  {form.title || "Edit Trip"}
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCancel}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm flex items-center gap-2 shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT COLUMN (Main Form) ──────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* CARD: Basic Info */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Pencil size={15} className="text-cyan-600" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">Basic Information</h2>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Trip Name */}
                  <Field label="Trip Name" required error={errors.title}>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => handleChange("title", e.target.value)}
                      placeholder="e.g. Summer Bali Adventure"
                      maxLength={100}
                      className={`w-full h-12 px-4 rounded-xl border text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 bg-slate-50/50 outline-none transition-all ${
                        errors.title
                          ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                          : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                      }`}
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">{form.title.length}/100</div>
                  </Field>

                  {/* Destination */}
                  <Field label="Destination" required error={errors.destination}>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" />
                      <input
                        type="text"
                        value={form.destination}
                        onChange={e => handleChange("destination", e.target.value)}
                        placeholder="e.g. Bali, Indonesia"
                        className={`w-full h-12 pl-10 pr-4 rounded-xl border text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 bg-slate-50/50 outline-none transition-all ${
                          errors.destination
                            ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                            : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                        }`}
                      />
                    </div>
                  </Field>

                  {/* Description */}
                  <Field label="Description" hint="Optional">
                    <textarea
                      value={form.description}
                      onChange={e => handleChange("description", e.target.value)}
                      placeholder="Describe your trip, itinerary highlights, special notes…"
                      rows={4}
                      maxLength={2000}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 bg-slate-50/50 outline-none transition-all resize-none"
                    />
                    <div className="text-right text-xs text-slate-400 -mt-1">{form.description.length}/2000</div>
                  </Field>
                </div>
              </div>

              {/* CARD: Dates */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CalendarDays size={15} className="text-blue-600" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">Trip Dates</h2>
                  {tripDays && (
                    <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {tripDays} {tripDays === 1 ? "day" : "days"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Start Date" error={errors.startDate}>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => handleChange("startDate", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm font-semibold text-slate-800 bg-slate-50/50 outline-none transition-all"
                    />
                  </Field>
                  <Field label="End Date" error={errors.endDate}>
                    <input
                      type="date"
                      value={form.endDate}
                      min={form.startDate || undefined}
                      onChange={e => handleChange("endDate", e.target.value)}
                      className={`w-full h-12 px-4 rounded-xl border text-sm font-semibold text-slate-800 bg-slate-50/50 outline-none transition-all ${
                        errors.endDate
                          ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                          : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                      }`}
                    />
                  </Field>
                </div>
              </div>

              {/* CARD: Budget */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign size={15} className="text-emerald-600" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">Budget</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Currency */}
                  <Field label="Currency">
                    <select
                      value={form.currency}
                      onChange={e => handleChange("currency", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm font-bold text-slate-800 bg-slate-50/50 outline-none transition-all cursor-pointer"
                    >
                      {CURRENCY_OPTIONS.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} {c.code} — {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Budget Amount */}
                  <Field label="Total Budget" error={errors.budget} hint="Optional" className="sm:col-span-2">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-600 pointer-events-none">
                        {selectedCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        value={form.budget}
                        onChange={e => handleChange("budget", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={`w-full h-12 pl-10 pr-4 rounded-xl border text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 bg-slate-50/50 outline-none transition-all ${
                          errors.budget
                            ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                            : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                        }`}
                      />
                    </div>
                  </Field>
                </div>
              </div>

              {/* CARD: Cover Image */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Image size={15} className="text-violet-600" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">Cover Image</h2>
                </div>

                {/* Preview */}
                {imagePreview && (
                  <div className="relative mb-4 group rounded-2xl overflow-hidden border border-slate-200 h-48">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview("")}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={clearImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-rose-600 transition-all"
                      >
                        <Trash2 size={12} /> Remove Image
                      </button>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Set
                      </span>
                    </div>
                  </div>
                )}

                {/* URL Input */}
                <Field label="Image URL" hint="Paste a direct image link">
                  <div className="relative">
                    <Camera size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500 pointer-events-none" />
                    <input
                      type="url"
                      value={form.image}
                      onChange={e => handleImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50/50 outline-none transition-all"
                    />
                    {form.image && (
                      <button
                        onClick={clearImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer transition-all"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </Field>

                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Info size={11} />
                  You can use any public image URL (e.g. from Unsplash). Image upload support is coming soon.
                </p>
              </div>

              {/* CARD: Tags */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Tag size={15} className="text-orange-600" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">Tags</h2>
                  <span className="ml-auto text-xs text-slate-400">{form.tags.length}/10</span>
                </div>

                {/* Tag chips */}
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {form.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 text-orange-400 hover:text-rose-600 cursor-pointer transition-all"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add tag */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag (e.g. beach, adventure)"
                    disabled={form.tags.length >= 10}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50 outline-none transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim() || form.tags.length >= 10}
                    className="h-10 px-4 rounded-xl bg-orange-500 text-white text-xs font-black hover:bg-orange-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ────────────────────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* CARD: Status */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <RefreshCw size={14} className="text-slate-600" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900">Trip Status</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChange("status", opt.value)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                        form.status === opt.value
                          ? "border-current bg-current/5"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      style={form.status === opt.value ? { color: opt.color, borderColor: opt.color } : {}}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{opt.desc}</p>
                      </div>
                      {form.status === opt.value && (
                        <CheckCircle size={14} className="ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD: Visibility */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Eye size={14} className="text-slate-600" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900">Visibility</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {VISIBILITY_OPTIONS.map(opt => {
                    const isSelected = (opt.value === "public" && form.isPublic) || (opt.value === "private" && !form.isPublic);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleChange("isPublic", opt.value === "public")}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <opt.Icon size={15} style={{ color: isSelected ? opt.color : "#94A3B8" }} />
                        <div className="min-w-0 text-left">
                          <p className={`text-xs font-black ${isSelected ? "text-slate-900" : "text-slate-600"}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{opt.desc}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle size={14} className="ml-auto shrink-0 text-cyan-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CARD: Travel Style */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Globe size={14} className="text-pink-600" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900">Travel Style</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRAVEL_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => handleChange("travelType", form.travelType === type ? "" : type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        form.travelType === type
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent"
                          : "border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD: Members */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Users size={14} className="text-teal-600" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900">Max Members</h2>
                </div>
                <Field label="Max Members" hint="Optional" error={errors.maxMembers}>
                  <div className="relative">
                    <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500 pointer-events-none" />
                    <input
                      type="number"
                      value={form.maxMembers}
                      onChange={e => handleChange("maxMembers", e.target.value)}
                      placeholder="Unlimited"
                      min={1}
                      max={500}
                      className={`w-full h-11 pl-10 pr-4 rounded-xl border text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 bg-slate-50/50 outline-none transition-all ${
                        errors.maxMembers
                          ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                          : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                      }`}
                    />
                  </div>
                </Field>
              </div>

              {/* SAVE BUTTON (Sidebar CTA) */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>

              {/* Discard note */}
              <p className="text-center text-xs text-slate-400">
                Click <strong className="text-slate-600">Cancel</strong> to discard and go back
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EditTrip;
