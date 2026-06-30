// src/pages/TripNotes.jsx — Premium modern editor & Journal Upgrade

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import {
  Plus, Search, X, Trash2, MapPin, StickyNote, Pin,
  Calendar, Eye, BookOpen, Edit3, Tag
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { db } from "../services/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";

const NOTE_THEMES = [
  { bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", accent: "#F59E0B" },
  { bg: "#F0FDFA", border: "#99F6E4", dot: "#14B8B5", accent: "#14B8B5" },
  { bg: "#FAF5FF", border: "#E9D5FF", dot: "#8B5CF6", accent: "#8B5CF6" },
  { bg: "#FFF1F2", border: "#FECDD3", dot: "#F43F5E", accent: "#F43F5E" },
  { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", accent: "#3B82F6" },
  { bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E", accent: "#22C55E" },
];

const NoteCard = ({ note, index, onPin, onDelete, onEdit, isViewer }) => {
  const theme = NOTE_THEMES[index % NOTE_THEMES.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-[20px] p-4 border relative cursor-pointer group hover:shadow-md transition-shadow"
      style={{ background: theme.bg, borderColor: theme.border }}
      onClick={() => onEdit(note)}
    >
      {/* Color dot */}
      <div className="absolute top-3.5 left-3.5 w-2.5 h-2.5 rounded-full" style={{ background: theme.dot }} />

      <div className="pl-5 pr-12">
        <h3 className="text-sm font-bold text-slate-800 line-clamp-1 flex items-center gap-1.5">
          {note.title}
          {note.pinned && <Pin size={12} className="text-violet-500 fill-violet-500" />}
        </h3>
        
        {/* Day badge & Type */}
        <div className="flex gap-1.5 flex-wrap mt-1">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/60 text-slate-500">
            {note.type === "day" ? `Day ${note.day}` : "General"}
          </span>
          {note.tags && note.tags.map(tag => (
            <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/60 text-slate-400">
              #{tag}
            </span>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-2 line-clamp-4 leading-relaxed whitespace-pre-line">{note.content}</p>
      </div>

      <div className="flex items-center justify-between mt-3 pl-5">
        {note.createdAt && (
          <p className="text-[9px] text-slate-400">
            {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Floating Card Actions */}
      {!isViewer && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin(note._id, !note.pinned);
            }}
            className="w-6 h-6 rounded-full bg-white/80 border border-slate-100 flex items-center justify-center active:scale-90"
          >
            <Pin size={11} className={note.pinned ? "text-violet-500 fill-violet-500" : "text-slate-400"} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note._id);
            }}
            className="w-6 h-6 rounded-full bg-white/80 border border-slate-100 flex items-center justify-center active:scale-90"
          >
            <Trash2 size={11} className="text-red-400" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const TripNotes = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | journal
  const [filterDay, setFilterDay] = useState("all"); // all | general | [dayNumber]

  // Add/Edit states
  const [showSheet, setShowSheet] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    type: "trip",
    day: 1,
    pinned: false,
    tagInput: "",
    tags: []
  });
  const [saving, setSaving] = useState(false);
  const isViewer = trip?.role === "viewer";

  // Handle android back button for custom non-BottomSheet overlays
  useEffect(() => {
    if (!showSheet) return;
    const handleHardwareBack = (e) => {
      e.preventDefault();
      setShowSheet(false);
    };
    window.addEventListener("hardwareBack", handleHardwareBack);
    return () => {
      window.removeEventListener("hardwareBack", handleHardwareBack);
    };
  }, [showSheet]);

  useEffect(() => {
    let unsubscribe = null;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [tripRes, notesRes] = await Promise.all([
          fetch(getApiUrl(`trips/${id}`), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(getApiUrl(`notes/${id}`), { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const tripData = await tripRes.json();
        const notesData = await notesRes.json();
        if (tripData.success) setTrip(tripData.trip);
        const notesFromDB = (notesData.success && notesData.notes) ? notesData.notes : [];

        // Set up Firestore notes listener
        const notesColRef = collection(db, "trips", id, "notes");
        const q = query(notesColRef);
        unsubscribe = onSnapshot(q, async (snapshot) => {
          if (snapshot.empty && notesFromDB.length > 0) {
            // Auto-migrate from MongoDB to Firestore
            for (const note of notesFromDB) {
              const docRef = doc(db, "trips", id, "notes", note._id || note.id);
              await setDoc(docRef, {
                title: note.title || "",
                content: note.content || "",
                type: note.type || "trip",
                day: note.day || null,
                pinned: note.pinned || false,
                tags: note.tags || [],
                createdAt: note.createdAt ? new Date(note.createdAt) : serverTimestamp(),
                updatedAt: note.updatedAt ? new Date(note.updatedAt) : serverTimestamp()
              });
            }
            return;
          }

          const notesList = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            notesList.push({
              _id: doc.id,
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
            });
          });

          // Sort: pinned first, then by createdAt desc
          notesList.sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          setNotes(notesList);
          setPendingSync(snapshot.metadata.hasPendingWrites);
          setLoading(false);
        }, (err) => {
          console.error("Firestore notes subscribe error:", err);
          setLoading(false);
        });

      } catch (err) {
        console.error("Error loading journal notes data:", err);
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const daysCount = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.max(1, Math.ceil((end - start) / 86400000));
  }, [trip]);

  // Apply filters & search
  const filtered = useMemo(() => {
    return notes.filter(n => {
      const matchSearch =
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.content?.toLowerCase().includes(search.toLowerCase()) ||
        n.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchDay =
        filterDay === "all" ||
        (filterDay === "general" && n.type === "trip") ||
        (n.type === "day" && n.day === Number(filterDay));

      return matchSearch && matchDay;
    });
  }, [notes, search, filterDay]);

  // Grouped for Journal timeline view
  const journalGroups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const dayA = a.type === "trip" ? 0 : a.day;
      const dayB = b.type === "trip" ? 0 : b.day;
      if (dayA !== dayB) return dayA - dayB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const groups = {};
    sorted.forEach(n => {
      const groupKey = n.type === "trip" ? "General" : `Day ${n.day}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(n);
    });
    return groups;
  }, [filtered]);

  // Pin / Unpin Note
  const handlePinNote = async (noteId, pinState) => {
    try {
      const noteDocRef = doc(db, "trips", id, "notes", noteId);
      await updateDoc(noteDocRef, { pinned: pinState });
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      const noteDocRef = doc(db, "trips", id, "notes", noteId);
      await deleteDoc(noteDocRef);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleOpenAddSheet = () => {
    setEditingNote(null);
    setNoteForm({
      title: "",
      content: "",
      type: "trip",
      day: 1,
      pinned: false,
      tagInput: "",
      tags: []
    });
    setShowSheet(true);
  };

  const handleOpenEditSheet = (note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title || "",
      content: note.content || "",
      type: note.type || "trip",
      day: note.day || 1,
      pinned: note.pinned || false,
      tagInput: "",
      tags: note.tags || []
    });
    setShowSheet(true);
  };

  const handleSaveNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;

    try {
      setSaving(true);
      const notesColRef = collection(db, "trips", id, "notes");
      const body = {
        title: noteForm.title,
        content: noteForm.content,
        type: noteForm.type,
        day: noteForm.type === "day" ? Number(noteForm.day) : null,
        pinned: noteForm.pinned,
        tags: noteForm.tags,
        updatedAt: serverTimestamp(),
      };

      if (editingNote) {
        const noteDocRef = doc(db, "trips", id, "notes", editingNote._id);
        await updateDoc(noteDocRef, body);
      } else {
        const noteDocRef = doc(notesColRef);
        await setDoc(noteDocRef, {
          ...body,
          createdAt: serverTimestamp(),
        });
      }
      setShowSheet(false);
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Error saving note");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const clean = noteForm.tagInput.trim().replace(/^#/, "");
    if (clean && !noteForm.tags.includes(clean)) {
      setNoteForm(prev => ({
        ...prev,
        tags: [...prev.tags, clean],
        tagInput: ""
      }));
    }
  };

  const handleRemoveTag = (tag) => {
    setNoteForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="px-4 pt-4 space-y-4">
          <div className="h-14 skeleton rounded-[18px]" />
          <div className="h-10 skeleton rounded-full w-2/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-36 skeleton rounded-[20px]" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-24">
        {/* Header trip pill */}
        {trip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-3 mb-4 rounded-[18px] bg-white border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-[12px] bg-violet-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-violet-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                  Journal &amp; Notes
                  {pendingSync && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 animate-pulse">
                      Pending Sync
                    </span>
                  )}
                </p>
                <p className="text-xs font-bold text-slate-700 truncate">{trip.title} · {trip.destination}</p>
              </div>
            </div>
            {/* View Switcher */}
            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid" ? "bg-white text-slate-800 shadow-xs" : "text-slate-400"
                }`}
              >
                <StickyNote size={14} />
              </button>
              <button
                onClick={() => setViewMode("journal")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "journal" ? "bg-white text-slate-800 shadow-xs" : "text-slate-400"
                }`}
              >
                <BookOpen size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Filters & Search */}
        <div className="space-y-3 mb-5">
          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-[18px] bg-white border border-slate-200 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, content, #tags..."
              className="flex-1 text-slate-700 text-xs font-bold placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Day Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button
              onClick={() => setFilterDay("all")}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                filterDay === "all" ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              All Days ({notes.length})
            </button>
            <button
              onClick={() => setFilterDay("general")}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                filterDay === "general" ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              General Info
            </button>
            {Array.from({ length: daysCount }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => setFilterDay(day.toString())}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                  filterDay === day.toString() ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        {notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 dark:bg-slate-800/20 dark:border-slate-800"
          >
            <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-3xl mb-2">
              📝
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Your Travel Journal is Empty</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mb-4">
              Write down your travel memories, flight details, restaurant bookings, or general notes about your trip.
            </p>
            {!isViewer ? (
              <button
                onClick={handleOpenAddSheet}
                className="py-3 px-6 rounded-full text-white font-bold text-xs shadow-brand active:scale-95 transition-all flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
              >
                <Plus size={14} /> Add Note
              </button>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                As a viewer, you cannot add notes to this trip.
              </p>
            )}
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-violet-50 flex items-center justify-center">
              <StickyNote size={28} className="text-violet-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">No matching notes</p>
              <p className="text-slate-400 text-xs mt-0.5">Try a different search or day filter</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map((note, i) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  index={i}
                  onPin={handlePinNote}
                  onDelete={handleDeleteNote}
                  onEdit={handleOpenEditSheet}
                  isViewer={isViewer}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* JOURNAL TIMELINE VIEW */
          <div className="relative pl-4 space-y-6">
            {/* Main Timeline Line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-slate-200" />
            
            {Object.keys(journalGroups).map((dayGroup) => (
              <div key={dayGroup} className="space-y-3 relative">
                {/* Timeline node badge */}
                <div className="flex items-center gap-2 -ml-6 mb-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-violet-500 border-[3px] border-white z-10 shadow-xs" />
                  <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {dayGroup}
                  </span>
                </div>
                
                {/* Notes in this group */}
                <div className="grid grid-cols-1 gap-3">
                  {journalGroups[dayGroup].map((note, i) => (
                    <div
                      key={note._id}
                      onClick={() => handleOpenEditSheet(note)}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-violet-300 transition-colors relative group"
                    >
                      <div className="pr-12">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            {note.title}
                            {note.pinned && <Pin size={10} className="text-violet-500 fill-violet-500" />}
                          </h4>
                          {note.tags && note.tags.map(t => (
                            <span key={t} className="text-[9px] font-semibold text-slate-400">#{t}</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">{note.content}</p>
                        {note.createdAt && (
                          <span className="text-[9px] text-slate-300 font-bold block mt-2">
                            {new Date(note.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      {/* Quick Actions */}
                      {!isViewer && (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePinNote(note._id, !note.pinned); }}
                            className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center"
                          >
                            <Pin size={10} className={note.pinned ? "text-violet-500 fill-violet-500" : "text-slate-400"} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }}
                            className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center"
                          >
                            <Trash2 size={10} className="text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Trigger */}
      {!isViewer && (
        <motion.button
          whileTap={{ scale: 0.90 }}
          onClick={handleOpenAddSheet}
          className="fixed z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-brand"
          style={{
            background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
            bottom: "calc(96px + max(env(safe-area-inset-bottom), 12px))",
            right: "16px",
          }}
        >
          <Plus size={24} />
        </motion.button>
      )}

      {/* ADD/EDIT NOTE BOTTOM SHEET */}
      <AnimatePresence>
        {showSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            {/* Sheet wrapper */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-extrabold text-slate-800">
                  {editingNote ? "Edit Note" : "New Note"}
                </h3>
                <button
                  onClick={() => setShowSheet(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <X size={16} className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="E.g. Travel directions, Packing idea..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-400 transition-colors"
                    disabled={isViewer}
                  />
                </div>

                {/* Type & Day Select */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                    <select
                      value={noteForm.type}
                      onChange={e => setNoteForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 outline-none focus:border-violet-400"
                      disabled={isViewer}
                    >
                      <option value="trip">General Info</option>
                      <option value="day">Day Specific</option>
                    </select>
                  </div>

                  {noteForm.type === "day" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assign to Day</label>
                      <select
                        value={noteForm.day}
                        onChange={e => setNoteForm(p => ({ ...p, day: e.target.value }))}
                        className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 outline-none focus:border-violet-400"
                        disabled={isViewer}
                      >
                        {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Content</label>
                  <textarea
                    value={noteForm.content}
                    onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                    placeholder="Write details..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-violet-400 transition-colors resize-none leading-relaxed"
                    disabled={isViewer}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tags</label>
                  {!isViewer && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={noteForm.tagInput}
                        onChange={e => setNoteForm(p => ({ ...p, tagInput: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                        placeholder="Add tag (e.g. transport, food)"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-violet-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {/* Tag Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {noteForm.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                        {!isViewer && (
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="text-violet-400 hover:text-violet-600">
                            <X size={10} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pin Note */}
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noteForm.pinned}
                    onChange={e => setNoteForm(p => ({ ...p, pinned: e.target.checked }))}
                    className="accent-violet-500"
                    disabled={isViewer}
                  />
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Pin size={11} className="text-violet-500 fill-violet-500" />
                    Pin note to top of list
                  </span>
                </label>

                {/* Save button */}
                {!isViewer && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveNote}
                    disabled={!noteForm.title.trim() || !noteForm.content.trim() || saving}
                    className="w-full py-4 rounded-full text-white font-bold text-xs shadow-brand disabled:opacity-50 mt-2"
                    style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
                  >
                    {saving ? "Saving Changes..." : "Save Note"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default TripNotes;