// src/pages/NoteEditor.jsx — Full-page Note Create / Edit (no modal)
// Routes:  /trip-notes/:tripId/new
//          /trip-notes/:tripId/:noteId/edit

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Loader2, Pin, Tag, X,
  Calendar, FileText, Info, Palette, AlertTriangle,
  CheckCircle, Trash2, Eye
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { db } from "../services/firebase";
import {
  collection, doc, setDoc, updateDoc,
  query, onSnapshot, serverTimestamp
} from "firebase/firestore";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NOTE_THEMES = [
  { id: "amber",   label: "Amber",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500",   ring: "ring-amber-400"   },
  { id: "teal",    label: "Teal",    bg: "bg-teal-50",    border: "border-teal-200",    dot: "bg-teal-500",    ring: "ring-teal-400"    },
  { id: "violet",  label: "Violet",  bg: "bg-violet-50",  border: "border-violet-200",  dot: "bg-violet-500",  ring: "ring-violet-400"  },
  { id: "rose",    label: "Rose",    bg: "bg-rose-50",    border: "border-rose-200",    dot: "bg-rose-500",    ring: "ring-rose-400"    },
  { id: "blue",    label: "Blue",    bg: "bg-blue-50",    border: "border-blue-200",    dot: "bg-blue-500",    ring: "ring-blue-400"    },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-400" },
];

const NOTE_CATEGORIES = [
  "General Info", "Hotel / Stay", "Flight / Transport",
  "Food & Dining", "Activities", "Emergency", "Packing", "Budget", "Other"
];

const NOTE_PRIORITIES = [
  { value: "low",    label: "Low",    color: "text-slate-500 bg-slate-100" },
  { value: "normal", label: "Normal", color: "text-blue-600 bg-blue-50"   },
  { value: "high",   label: "High",   color: "text-rose-600 bg-rose-50"   },
];

// ─── EMPTY FORM ───────────────────────────────────────────────────────────────
const emptyForm = () => ({
  title: "",
  content: "",
  type: "trip",          // "trip" | "day"
  day: 1,
  pinned: false,
  tags: [],
  tagInput: "",
  theme: "teal",
  category: "General Info",
  priority: "normal",
});

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
const Field = ({ label, required, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
      {label}
      {required && <span className="text-rose-500">*</span>}
      {hint && <span className="ml-auto text-[10px] font-semibold text-slate-400 normal-case">{hint}</span>}
    </label>
    {children}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const NoteEditor = () => {
  const { tripId, noteId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(noteId);

  const [trip, setTrip]         = useState(null);
  const [loading, setLoading]   = useState(isEdit); // only loading on edit
  const [saving, setSaving]     = useState(false);
  const [isDirty, setIsDirty]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [form, setForm]         = useState(emptyForm());

  // ── Calculate trip days ─────────────────────────────────────────────────────
  const daysCount = React.useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 7;
    const s = new Date(trip.startDate);
    const e = new Date(trip.endDate);
    return Math.max(1, Math.ceil((e - s) / 86400000));
  }, [trip]);

  // ── Fetch trip metadata ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;
    const token = localStorage.getItem("token");
    fetch(getApiUrl(`trips/${tripId}`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setTrip(d.trip); })
      .catch(err => console.error("[NoteEditor] trip fetch:", err));
  }, [tripId]);

  // ── In Edit mode: load note from Firestore ──────────────────────────────────
  useEffect(() => {
    if (!isEdit || !tripId || !noteId) { setLoading(false); return; }

    const noteRef = doc(db, "trips", tripId, "notes", noteId);
    // One-time read via onSnapshot unsubscribe immediately
    const unsub = onSnapshot(noteRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          title:    d.title    || "",
          content:  d.content  || "",
          type:     d.type     || "trip",
          day:      d.day      || 1,
          pinned:   d.pinned   || false,
          tags:     Array.isArray(d.tags) ? d.tags : [],
          tagInput: "",
          theme:    d.theme    || "teal",
          category: d.category || "General Info",
          priority: d.priority || "normal",
        });
      } else {
        // Fallback: try MongoDB via API
        console.warn("[NoteEditor] Note not in Firestore, falling back to API");
        const token = localStorage.getItem("token");
        fetch(getApiUrl(`notes/${tripId}`), {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(d => {
            if (d.success && d.notes) {
              const found = d.notes.find(n => n._id === noteId || n.id === noteId);
              if (found) {
                setForm({
                  title:    found.title    || "",
                  content:  found.content  || "",
                  type:     found.type     || "trip",
                  day:      found.day      || 1,
                  pinned:   found.pinned   || false,
                  tags:     Array.isArray(found.tags) ? found.tags : [],
                  tagInput: "",
                  theme:    found.theme    || "teal",
                  category: found.category || "General Info",
                  priority: found.priority || "normal",
                });
              }
            }
          })
          .catch(err => console.error("[NoteEditor] fallback fetch:", err));
      }
      setLoading(false);
      unsub(); // stop listening after first snap
    }, (err) => {
      console.error("[NoteEditor] Firestore read error:", err);
      setLoading(false);
      unsub();
    });

    return () => unsub();
  }, [isEdit, tripId, noteId]);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
    setIsDirty(true);
  };

  const addTag = () => {
    const clean = form.tagInput.trim().replace(/^#/, "");
    if (!clean || form.tags.includes(clean) || form.tags.length >= 10) return;
    handleChange("tags", [...form.tags, clean]);
    setForm(f => ({ ...f, tagInput: "" }));
  };

  const removeTag = (tag) => {
    handleChange("tags", form.tags.filter(t => t !== tag));
  };

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title   = "Title is required";
    if (!form.content.trim()) e.content = "Content is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      title:    form.title.trim(),
      content:  form.content.trim(),
      type:     form.type,
      day:      form.type === "day" ? Number(form.day) : null,
      pinned:   form.pinned,
      tags:     form.tags,
      theme:    form.theme,
      category: form.category,
      priority: form.priority,
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEdit) {
        // ── UPDATE existing note ──────────────────────────────────────────
        const noteRef = doc(db, "trips", tripId, "notes", noteId);
        await updateDoc(noteRef, payload);

        // Sync to MongoDB (best-effort)
        try {
          const token = localStorage.getItem("token");
          await fetch(getApiUrl(`notes/${noteId}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title:   payload.title,
              content: payload.content,
              type:    payload.type,
              day:     payload.day,
              pinned:  payload.pinned,
              tags:    payload.tags,
            }),
          });
        } catch (syncErr) {
          console.warn("[NoteEditor] MongoDB sync failed (Firestore updated OK):", syncErr);
        }

        navigate(`/trip-notes/${tripId}`, { replace: true });
      } else {
        // ── CREATE new note ───────────────────────────────────────────────
        const notesColRef = collection(db, "trips", tripId, "notes");
        const noteRef = doc(notesColRef);
        await setDoc(noteRef, { ...payload, createdAt: serverTimestamp() });

        // Sync to MongoDB (best-effort)
        try {
          const token = localStorage.getItem("token");
          await fetch(getApiUrl("notes/create"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              trip:    tripId,
              title:   payload.title,
              content: payload.content,
              type:    payload.type,
              day:     payload.day,
              pinned:  payload.pinned,
              tags:    payload.tags,
            }),
          });
        } catch (syncErr) {
          console.warn("[NoteEditor] MongoDB sync failed (Firestore updated OK):", syncErr);
        }

        navigate(`/trip-notes/${tripId}`, { replace: true });
      }
    } catch (err) {
      console.error("[NoteEditor] Save failed:", err);
      alert("Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const currentTheme = NOTE_THEMES.find(t => t.id === form.theme) || NOTE_THEMES[1];

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-teal-500 animate-spin" />
            <p className="text-sm font-bold text-slate-500">Loading note…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

        {/* ── STICKY HEADER ───────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(`/trip-notes/${tripId}`)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider">
                  {isEdit ? "Edit Note" : "New Note"} · {trip?.title || "Trip Notes"}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {form.title || (isEdit ? "Editing…" : "Untitled Note")}
                </p>
              </div>
              {isDirty && (
                <span className="hidden sm:inline-flex text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Unsaved
                </span>
              )}
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(`/trip-notes/${tripId}`)}
                className="hidden sm:flex h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              {isEdit && (
                <button
                  onClick={() => navigate(`/trip-notes/${tripId}/${noteId}`)}
                  className="hidden sm:flex h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer items-center gap-1.5"
                >
                  <Eye size={13} /> Preview
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 size={13} className="animate-spin" /> Saving…</>
                ) : (
                  <><Save size={13} /> {isEdit ? "Save Changes" : "Create Note"}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ───────────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* ── EDITOR (left 2/3) ────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Title */}
              <div className={`bg-white dark:bg-slate-900 rounded-[24px] border shadow-sm p-6 ${currentTheme.border}`}>
                <Field label="Note Title" required error={errors.title}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => handleChange("title", e.target.value)}
                    placeholder="e.g. Hotel Check-in Details, Packing List, Day 2 Plan…"
                    maxLength={150}
                    autoFocus
                    className={`w-full h-12 px-4 rounded-xl border text-sm font-semibold text-slate-800 dark:text-white placeholder:font-normal placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800/50 outline-none transition-all ${
                      errors.title
                        ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        : "border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertTriangle size={11} /> {errors.title}
                    </p>
                  )}
                  <div className="text-right text-[10px] text-slate-400">{form.title.length}/150</div>
                </Field>
              </div>

              {/* Content */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <Field label="Note Content" required error={errors.content}>
                  <textarea
                    value={form.content}
                    onChange={e => handleChange("content", e.target.value)}
                    placeholder="Write your thoughts, booking details, daily plans, emergency contacts, packing reminders…"
                    rows={12}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800/50 outline-none transition-all resize-y leading-relaxed ${
                      errors.content
                        ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        : "border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    }`}
                  />
                  {errors.content && (
                    <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertTriangle size={11} /> {errors.content}
                    </p>
                  )}
                  <div className="text-right text-[10px] text-slate-400">{form.content.length} chars</div>
                </Field>
              </div>

              {/* Tags */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                    <Tag size={13} className="text-violet-600" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Tags</h3>
                  <span className="ml-auto text-[10px] text-slate-400">{form.tags.length}/10</span>
                </div>

                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="text-teal-400 hover:text-rose-500 cursor-pointer transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.tagInput}
                    onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag (e.g. hotel, food, flight)"
                    disabled={form.tags.length >= 10}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800/50 outline-none transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={addTag}
                    disabled={!form.tagInput.trim() || form.tags.length >= 10}
                    className="h-10 px-4 rounded-xl bg-teal-500 text-white text-xs font-extrabold hover:bg-teal-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Mobile Save (sticky) */}
              <div className="lg:hidden sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-60"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving…</>
                  ) : (
                    <><Save size={16} /> {isEdit ? "Save Changes" : "Create Note"}</>
                  )}
                </button>
              </div>
            </div>

            {/* ── METADATA SIDEBAR (right 1/3) ─────────────────────────── */}
            <div className="flex flex-col gap-5">

              {/* Type & Day */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={14} className="text-blue-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Day Assignment</h3>
                </div>
                <div className="flex flex-col gap-3">
                  <select
                    value={form.type}
                    onChange={e => handleChange("type", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-teal-500 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 outline-none cursor-pointer"
                  >
                    <option value="trip">General (whole trip)</option>
                    <option value="day">Day-specific</option>
                  </select>
                  {form.type === "day" && (
                    <select
                      value={form.day}
                      onChange={e => handleChange("day", Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-teal-500 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 outline-none cursor-pointer"
                    >
                      {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>Day {d}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Category & Priority */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-orange-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Category & Priority</h3>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={e => handleChange("category", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-teal-500 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 outline-none cursor-pointer"
                    >
                      {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                    <div className="flex gap-2">
                      {NOTE_PRIORITIES.map(p => (
                        <button
                          key={p.value}
                          onClick={() => handleChange("priority", p.value)}
                          className={`flex-1 h-9 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            form.priority === p.value
                              ? p.color + " border-current"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Theme */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={14} className="text-pink-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Color Theme</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NOTE_THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleChange("theme", t.id)}
                      title={t.label}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${t.dot} ${
                        form.theme === t.id
                          ? `ring-2 ring-offset-2 ${t.ring} border-white`
                          : "border-white/50 hover:scale-110"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Selected: <span className="font-bold capitalize">{form.theme}</span>
                </p>
              </div>

              {/* Pin Toggle */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => handleChange("pinned", !form.pinned)}
                    className={`w-11 h-6 rounded-full border-2 transition-all relative ${
                      form.pinned
                        ? "bg-violet-500 border-violet-500"
                        : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      form.pinned ? "left-[22px]" : "left-0.5"
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Pin size={12} className={form.pinned ? "text-violet-500 fill-violet-500" : "text-slate-400"} />
                      Pin to Top
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Pinned notes always appear first
                    </p>
                  </div>
                </label>
              </div>

              {/* Save CTA (Desktop sidebar) */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="hidden lg:flex w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving…</>
                ) : (
                  <><Save size={16} /> {isEdit ? "Save Changes" : "Create Note"}</>
                )}
              </button>

              {/* Cancel link */}
              <button
                onClick={() => navigate(`/trip-notes/${tripId}`)}
                className="hidden lg:block w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer -mt-2"
              >
                ← Back to Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NoteEditor;
