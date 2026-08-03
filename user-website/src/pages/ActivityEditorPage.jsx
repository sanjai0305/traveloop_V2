// src/pages/ActivityEditorPage.jsx — Full-page Activity Create & Edit
// Routes: /trips/:tripId/activities/new
//         /trips/:tripId/activities/:activityId/edit

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Loader2, Compass, Calendar, Clock, DollarSign,
  MapPin, Star, AlertTriangle, Image as ImageIcon, FileText, CheckCircle
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { db } from "../services/firebase";
import {
  collection, doc, setDoc, updateDoc, onSnapshot, serverTimestamp
} from "firebase/firestore";

const CATEGORIES = ["Sightseeing", "Adventure", "Food & Dining", "Culture", "Relaxation", "Shopping", "Transport", "Other"];
const STATUSES = ["Planned", "In Progress", "Completed"];

const Field = ({ label, required, children, hint, error }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
      <span>{label} {required && <span className="text-rose-500">*</span>}</span>
      {hint && <span className="text-[10px] font-medium text-slate-400 normal-case">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><AlertTriangle size={11} /> {error}</p>}
  </div>
);

const ActivityEditorPage = () => {
  const { tripId, activityId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(activityId);

  const [trip, setTrip]         = useState(null);
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});

  const [form, setForm] = useState({
    title: "",
    category: "Sightseeing",
    day: 1,
    time: "10:00 AM",
    duration: "2 hours",
    cost: "",
    place: "",
    rating: 4.5,
    status: "Planned",
    image: "",
    note: "",
  });

  // Calculate days count
  const daysCount = React.useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 7;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.max(1, Math.ceil((end - start) / 86400000));
  }, [trip]);

  // Load trip metadata
  useEffect(() => {
    if (!tripId) return;
    const token = localStorage.getItem("token");
    fetch(getApiUrl(`trips/${tripId}`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setTrip(d.trip); })
      .catch(err => console.error("[ActivityEditorPage] Trip fetch error:", err));
  }, [tripId]);

  // If Edit mode, load existing activity
  useEffect(() => {
    if (!isEdit || !tripId || !activityId) return;

    // Try Firestore first
    const docRef = doc(db, "trips", tripId, "itinerary", activityId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          title:    d.title    || "",
          category: d.category || "Sightseeing",
          day:      d.day      || 1,
          time:     d.time     || "",
          duration: d.duration || "1 hour",
          cost:     d.budget !== undefined ? d.budget : (d.cost || ""),
          place:    d.place    || "",
          rating:   d.rating   || 4.5,
          status:   d.status   || "Planned",
          image:    d.image    || "",
          note:     d.description || d.note || "",
        });
        setLoading(false);
      } else {
        // Fallback: API fetch
        const token = localStorage.getItem("token");
        fetch(getApiUrl(`trips/${tripId}/activities`), {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(d => {
            if (d.success && d.activities) {
              const found = d.activities.find(a => a._id === activityId || a.id === activityId);
              if (found) {
                setForm({
                  title:    found.title    || "",
                  category: found.category || "Sightseeing",
                  day:      found.day      || 1,
                  time:     found.time     || "",
                  duration: found.duration || "1 hour",
                  cost:     found.cost !== undefined ? found.cost : (found.budget || ""),
                  place:    found.place    || "",
                  rating:   found.rating   || 4.5,
                  status:   found.status   || "Planned",
                  image:    found.image    || "",
                  note:     found.note     || found.description || "",
                });
              }
            }
            setLoading(false);
          })
          .catch(err => {
            console.error("[ActivityEditorPage] API load fallback error:", err);
            setLoading(false);
          });
      }
    });

    return () => unsub();
  }, [isEdit, tripId, activityId]);

  const handleChange = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Activity title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      title:    form.title.trim(),
      category: form.category,
      day:      Number(form.day) || 1,
      time:     form.time.trim(),
      duration: form.duration.trim(),
      cost:     Number(form.cost) || 0,
      budget:   Number(form.cost) || 0,
      place:    form.place.trim(),
      rating:   Number(form.rating) || 4.5,
      status:   form.status,
      image:    form.image.trim(),
      note:     form.note.trim(),
      description: form.note.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      const token = localStorage.getItem("token");

      if (isEdit) {
        // UPDATE existing
        try {
          const docRef = doc(db, "trips", tripId, "itinerary", activityId);
          await updateDoc(docRef, payload);
        } catch (fErr) {
          console.warn("[ActivityEditorPage] Firestore update fallback:", fErr);
        }

        await fetch(getApiUrl(`trips/${tripId}/activities/${activityId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

      } else {
        // CREATE new
        const colRef = collection(db, "trips", tripId, "itinerary");
        const newDocRef = doc(colRef);
        await setDoc(newDocRef, { ...payload, createdAt: serverTimestamp() });

        await fetch(getApiUrl(`trips/${tripId}/activities`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      navigate(`/trips/${tripId}/activities`, { replace: true });
    } catch (err) {
      console.error("[ActivityEditorPage] Save failed:", err);
      alert("Failed to save activity. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="text-teal-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading activity data…</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">

        {/* STICKY HEADER */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(`/trips/${tripId}/activities`)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider truncate">
                  {trip?.title || "Trip Activities"}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {isEdit ? "Edit Activity" : "Create New Activity"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/trips/${tripId}/activities`)}
                className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-teal-500/20 hover:scale-102 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 size={13} className="animate-spin" /> Saving…</>
                ) : (
                  <><Save size={13} /> {isEdit ? "Save Changes" : "Save Activity"}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">

            {/* Section 1: Core Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Compass size={16} className="text-teal-500" />
                <span>Activity Overview</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <Field label="Activity Title" required error={errors.title}>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => handleChange("title", e.target.value)}
                      placeholder="e.g. Paragliding at Bir Billing, Scuba Diving, Temple Tour..."
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500 transition-colors"
                      autoFocus
                    />
                  </Field>
                </div>

                {/* Category */}
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={e => handleChange("category", e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                {/* Status */}
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={e => handleChange("status", e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Section 2: Schedule & Location */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Calendar size={16} className="text-indigo-500" />
                <span>Schedule & Location</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Day */}
                <Field label="Assigned Day">
                  <select
                    value={form.day}
                    onChange={e => handleChange("day", e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500"
                  >
                    {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </Field>

                {/* Time */}
                <Field label="Start Time" hint="e.g. 10:00 AM">
                  <input
                    type="text"
                    value={form.time}
                    onChange={e => handleChange("time", e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500"
                  />
                </Field>

                {/* Duration */}
                <Field label="Duration" hint="e.g. 2 hours">
                  <input
                    type="text"
                    value={form.duration}
                    onChange={e => handleChange("duration", e.target.value)}
                    placeholder="2 hours"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500"
                  />
                </Field>
              </div>

              {/* Location */}
              <Field label="Location / Venue">
                <input
                  type="text"
                  value={form.place}
                  onChange={e => handleChange("place", e.target.value)}
                  placeholder="e.g. Bir Billing Paragliding Site, Kangra Valley..."
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500"
                />
              </Field>
            </div>

            {/* Section 3: Cost & Media */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <DollarSign size={16} className="text-emerald-500" />
                <span>Cost & Media</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cost */}
                <Field label="Estimated Cost (₹)" hint="Will sync to Budget">
                  <input
                    type="number"
                    value={form.cost}
                    onChange={e => handleChange("cost", e.target.value)}
                    placeholder="e.g. 3500"
                    min="0"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500"
                  />
                </Field>

                {/* Rating */}
                <Field label="Rating (1 to 5)">
                  <input
                    type="number"
                    value={form.rating}
                    onChange={e => handleChange("rating", e.target.value)}
                    placeholder="4.5"
                    min="1"
                    max="5"
                    step="0.1"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500"
                  />
                </Field>
              </div>

              {/* Photo URL */}
              <Field label="Cover Image URL" hint="Unsplash or image link">
                <input
                  type="url"
                  value={form.image}
                  onChange={e => handleChange("image", e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500"
                />
              </Field>

              {/* Notes */}
              <Field label="Notes & Booking Instructions">
                <textarea
                  value={form.note}
                  onChange={e => handleChange("note", e.target.value)}
                  placeholder="Add details, confirmation numbers, meeting points, what to wear..."
                  rows={4}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-teal-500 resize-none leading-relaxed"
                />
              </Field>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/trips/${tripId}/activities`)}
                className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:scale-102 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving…</>
                ) : (
                  <><Save size={14} /> {isEdit ? "Save Changes" : "Save Activity"}</>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default ActivityEditorPage;
