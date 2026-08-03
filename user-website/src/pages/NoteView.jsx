// src/pages/NoteView.jsx — Full-page read-only note view
// Route: /trip-notes/:tripId/:noteId

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit3, Trash2, Pin, Tag, Calendar,
  Clock, Loader2, AlertTriangle, FileText, Palette
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { db } from "../services/firebase";
import { doc, deleteDoc, onSnapshot } from "firebase/firestore";

// ─── THEME MAP ────────────────────────────────────────────────────────────────
const THEME_MAP = {
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/20",   border: "border-amber-200 dark:border-amber-800/40",   dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-300",   badge: "bg-amber-100 text-amber-700 border-amber-200" },
  teal:    { bg: "bg-teal-50 dark:bg-teal-950/20",     border: "border-teal-200 dark:border-teal-800/40",     dot: "bg-teal-500",    text: "text-teal-700 dark:text-teal-300",     badge: "bg-teal-100 text-teal-700 border-teal-200"   },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200 dark:border-violet-800/40", dot: "bg-violet-500",  text: "text-violet-700 dark:text-violet-300", badge: "bg-violet-100 text-violet-700 border-violet-200" },
  rose:    { bg: "bg-rose-50 dark:bg-rose-950/20",     border: "border-rose-200 dark:border-rose-800/40",     dot: "bg-rose-500",    text: "text-rose-700 dark:text-rose-300",     badge: "bg-rose-100 text-rose-700 border-rose-200"   },
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/20",     border: "border-blue-200 dark:border-blue-800/40",     dot: "bg-blue-500",    text: "text-blue-700 dark:text-blue-300",     badge: "bg-blue-100 text-blue-700 border-blue-200"   },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/40", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const DEFAULT_THEME = THEME_MAP.teal;

const PRIORITY_COLORS = {
  low:    "bg-slate-100 text-slate-600 border-slate-200",
  normal: "bg-blue-50 text-blue-600 border-blue-200",
  high:   "bg-rose-50 text-rose-600 border-rose-200",
};

const fmt = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const NoteView = () => {
  const { tripId, noteId } = useParams();
  const navigate = useNavigate();

  const [note, setNote]         = useState(null);
  const [trip, setTrip]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // ── Fetch trip metadata ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;
    const token = localStorage.getItem("token");
    fetch(getApiUrl(`trips/${tripId}`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setTrip(d.trip); })
      .catch(err => console.error("[NoteView] trip fetch:", err));
  }, [tripId]);

  // ── Subscribe to Firestore note ─────────────────────────────────────────────
  useEffect(() => {
    if (!tripId || !noteId) return;

    const noteRef = doc(db, "trips", tripId, "notes", noteId);
    const unsub = onSnapshot(noteRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setNote({
          _id: snap.id,
          id:  snap.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || null,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt || null,
        });
        setNotFound(false);
      } else {
        // Firestore doc missing — try MongoDB
        const token = localStorage.getItem("token");
        fetch(getApiUrl(`notes/${tripId}`), {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(d => {
            const found = d.notes?.find(n => n._id === noteId || n.id === noteId);
            if (found) setNote(found);
            else setNotFound(true);
          })
          .catch(() => setNotFound(true));
      }
      setLoading(false);
    }, (err) => {
      console.error("[NoteView] Firestore error:", err);
      setLoading(false);
      setNotFound(true);
    });

    return () => unsub();
  }, [tripId, noteId]);

  // ── Delete note ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      // Delete from Firestore
      const noteRef = doc(db, "trips", tripId, "notes", noteId);
      await deleteDoc(noteRef);

      // Sync delete to MongoDB (best-effort)
      try {
        const token = localStorage.getItem("token");
        await fetch(getApiUrl(`notes/${noteId}`), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (syncErr) {
        console.warn("[NoteView] MongoDB delete sync failed:", syncErr);
      }

      navigate(`/trip-notes/${tripId}`, { replace: true });
    } catch (err) {
      console.error("[NoteView] Delete failed:", err);
      alert("Failed to delete note. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

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

  // ── Not Found ───────────────────────────────────────────────────────────────
  if (notFound || !note) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
          <span className="text-6xl">📝</span>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Note Not Found</h2>
          <p className="text-sm text-slate-500">This note may have been deleted or does not exist.</p>
          <button
            onClick={() => navigate(`/trip-notes/${tripId}`)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            ← Back to Notes
          </button>
        </div>
      </MainLayout>
    );
  }

  const theme = THEME_MAP[note.theme] || DEFAULT_THEME;
  const priorityColor = PRIORITY_COLORS[note.priority] || PRIORITY_COLORS.normal;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">

        {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Back */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(`/trip-notes/${tripId}`)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider">
                  {trip?.title || "Trip Notes"}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {note.title}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`h-9 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${
                  confirmDelete
                    ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse"
                    : "border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                }`}
              >
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>{confirmDelete ? "Confirm Delete" : "Delete"}</span>
              </button>
              {confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              {/* Edit */}
              <button
                onClick={() => navigate(`/trip-notes/${tripId}/${noteId}/edit`)}
                className="h-9 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Edit3 size={13} /> Edit Note
              </button>
            </div>
          </div>
        </div>

        {/* ── NOTE CONTENT ──────────────────────────────────────────────── */}
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Hero Card */}
          <div className={`rounded-[24px] border p-8 ${theme.bg} ${theme.border}`}>
            {/* Color accent + pin */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-3 h-3 rounded-full ${theme.dot}`} />
              {note.pinned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[11px] font-extrabold border border-violet-200 dark:border-violet-800">
                  <Pin size={10} className="fill-violet-500" /> Pinned
                </span>
              )}
              {note.priority && note.priority !== "normal" && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${priorityColor}`}>
                  {note.priority === "high" ? "🔴 High Priority" : "🔵 Low Priority"}
                </span>
              )}
              {note.category && (
                <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${theme.badge}`}>
                  <FileText size={10} /> {note.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-3">
              {note.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-teal-500" />
                {note.type === "day" ? `Day ${note.day}` : "General Info"}
              </span>
              {note.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  Created: {fmt(note.createdAt)}
                </span>
              )}
              {note.updatedAt && note.updatedAt !== note.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  Updated: {fmt(note.updatedAt)}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-current/10 mb-6" />

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {note.content || <span className="italic text-slate-400">No content</span>}
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-current/10">
                <Tag size={13} className="text-slate-400 mt-0.5 shrink-0" />
                {note.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons (bottom) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/trip-notes/${tripId}/${noteId}/edit`)}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all cursor-pointer"
            >
              <Edit3 size={16} /> Edit This Note
            </button>
            <button
              onClick={() => navigate(`/trip-notes/${tripId}`)}
              className="flex-1 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to Notes
            </button>
          </div>

          {/* Delete confirmation warning */}
          {confirmDelete && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-rose-700 dark:text-rose-400">Delete this note?</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
                  This action cannot be undone. The note will be permanently removed.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-600 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Yes, Delete Note
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NoteView;
