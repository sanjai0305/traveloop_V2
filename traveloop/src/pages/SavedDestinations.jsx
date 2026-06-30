// src/pages/SavedDestinations.jsx — Premium Saved Destinations list

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { ArrowLeft, Heart, Plus, MapPin, Trash2, Globe } from "lucide-react";
import { getApiUrl } from "../utils/api";

const COVERS = [
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
  "linear-gradient(135deg,#FA709A,#FEE140)",
];

const SUGGESTED_CHIPS = ["Bali, Indonesia", "Santorini, Greece", "Tokyo, Japan", "Swiss Alps, Switzerland", "Goa, India", "Paris, France"];

const SavedDestinations = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDest, setNewDest] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!newDest.trim()) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("profile/saved-destinations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ destination: newDest.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(data.savedDestinations || []);
        setNewDest("");
      }
    } catch (err) {
      alert("Failed to save destination");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl("profile/saved-destinations"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSaved(data.savedDestinations || []);
        }
      } catch (err) {
        console.error("Error loading saved destinations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleRemove = async (name) => {
    if (!window.confirm(`Remove ${name} from your saved destinations?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`profile/saved-destinations/${encodeURIComponent(name)}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSaved(data.savedDestinations || []);
      }
    } catch (err) {
      alert("Failed to remove destination");
    }
  };

  const handlePlanTrip = (name) => {
    navigate(`/create-trip?dest=${encodeURIComponent(name)}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="px-4 pt-4 space-y-4">
          <div className="h-10 skeleton rounded-lg w-1/3" />
          <div className="h-32 skeleton rounded-[24px]" />
          <div className="h-32 skeleton rounded-[24px]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 leading-tight flex items-center gap-2">
              Saved Places <Heart size={20} className="text-rose-500 fill-rose-500" />
            </h2>
            <p className="text-slate-400 text-xs font-semibold">Your bucket list destinations</p>
          </div>
        </div>

        {/* Save destination inline block */}
        <div className="premium-card p-4 mb-6">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Save New Place</p>
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              type="text"
              value={newDest}
              onChange={e => setNewDest(e.target.value)}
              placeholder="Enter destination (e.g. Paris, France)"
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-slate-200 text-xs font-bold bg-slate-50 dark:bg-slate-900"
            />
            <button
              type="submit"
              disabled={saving || !newDest.trim()}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-xs bg-teal-500 disabled:opacity-50 active:scale-95 transition-all flex-shrink-0"
            >
              Save
            </button>
          </form>
          
          {/* Suggest Destination Chips */}
          <div className="mt-3.5">
            <p className="text-[10px] font-bold text-slate-400 mb-2">Suggested places:</p>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
              {SUGGESTED_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setNewDest(chip)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {saved.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-slate-100 p-6 text-center"
          >
            <div className="w-16 h-16 rounded-[20px] bg-rose-50 flex items-center justify-center text-rose-500">
              <Globe size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No saved destinations yet</p>
              <p className="text-slate-400 text-xs mt-0.5 max-w-[240px] mx-auto">
                Explore activities or search cities to start saving places to your bucket list!
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-full text-white font-bold text-xs shadow-brand mt-2"
              style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
            >
              Explore Now
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {saved.map((name, index) => {
                const cover = COVERS[index % COVERS.length];
                const cityName = name.split(",")[0];
                const countryName = name.split(",")[1]?.trim() || "";

                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="premium-card overflow-hidden bg-white shadow-sm flex items-stretch border border-slate-100 h-28"
                  >
                    {/* Left Color Block */}
                    <div className="w-24 flex-shrink-0 flex items-center justify-center relative overflow-hidden" style={{ background: cover }}>
                      <span className="text-3xl text-white/20 select-none font-bold">📍</span>
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 truncate leading-tight">{cityName}</h4>
                        {countryName && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin size={10} className="text-slate-400" /> {countryName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          onClick={() => handlePlanTrip(name)}
                          className="px-3 py-1.5 rounded-full text-white text-[10px] font-bold shadow-sm"
                          style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                        >
                          <Plus size={10} className="inline mr-0.5" /> Plan Trip
                        </motion.button>
                      </div>
                    </div>

                    {/* Right Delete action */}
                    <div className="flex items-center justify-center px-4 border-l border-slate-50">
                      <button
                        onClick={() => handleRemove(name)}
                        className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SavedDestinations;
