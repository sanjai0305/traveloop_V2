import React, { useState } from "react";
import {
  Sparkles,
  Star,
  Clock,
  MapPin,
  Check,
  Eye,
  Plus,
  Compass,
  Bus,
  Hotel,
  Coffee,
  Calendar,
  X,
  IndianRupee,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { DEMO_TRIP_TEMPLATES, TripTemplate } from "../data/tripTemplates";

interface TripTemplateSelectorProps {
  onSelectTemplate: (template: TripTemplate) => void;
  onStartScratch: () => void;
}

export const TripTemplateSelector: React.FC<TripTemplateSelectorProps> = ({
  onSelectTemplate,
  onStartScratch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewTemplate, setPreviewTemplate] = useState<TripTemplate | null>(null);

  const categories = ["All", "Adventure", "Family", "Budget Tour", "Corporate", "Luxury", "Friends"];

  const filteredTemplates =
    selectedCategory === "All"
      ? DEMO_TRIP_TEMPLATES
      : DEMO_TRIP_TEMPLATES.filter((t) => t.tripType.toLowerCase() === selectedCategory.toLowerCase() || t.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-teal-950 p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            30-Second Express Trip Publishing
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Choose a Trip Template
          </h2>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Select from pre-configured high-converting travel packages with full itineraries, stay hotels, and transport pre-filled. Customize dates & prices in seconds!
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStartScratch}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all backdrop-blur-md"
            >
              <Plus className="w-4 h-4" /> Start from Scratch (Blank Form)
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                selectedCategory === cat
                  ? "bg-teal-500 text-white shadow-brand"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-slate-400 whitespace-nowrap hidden sm:inline-block">
          Showing {filteredTemplates.length} Ready Templates
        </span>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Scratch Card */}
        <div
          onClick={onStartScratch}
          className="group cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50/50 dark:bg-slate-900/30 p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[380px] shadow-sm hover:shadow-xl hover:-translate-y-1"
        >
          <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Create Custom Package
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs">
            Build your own travel itinerary completely from scratch step by step.
          </p>
          <span className="mt-6 px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-teal-500 group-hover:text-white transition-colors">
            Start Blank Form
          </span>
        </div>

        {/* Template Cards */}
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
          >
            {/* Card Media Header */}
            <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={tpl.coverImage}
                alt={tpl.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

              {/* Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10">
                  {tpl.tripType} • {tpl.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow flex items-center gap-1">
                  <Star size={11} className="fill-white" /> {tpl.rating} ({tpl.reviewsCount})
                </span>
              </div>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="flex items-center gap-1 text-teal-300 text-[11px] font-bold mb-0.5">
                  <MapPin size={12} />
                  <span>{tpl.originCity} → {tpl.destinations.join(", ")}</span>
                </div>
                <h3 className="font-black text-lg text-white leading-snug drop-shadow-sm line-clamp-1">
                  {tpl.title}
                </h3>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                  {tpl.tagline}
                </p>

                {/* Highlights Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold border border-teal-200/50">
                    <Clock size={11} /> {tpl.duration}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                    <Hotel size={11} /> {tpl.hotels[0]?.name || "Hotel Included"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                    <Bus size={11} /> {tpl.vehicleType}
                  </span>
                  {tpl.foodIncluded && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                      <Coffee size={11} /> Meals Included
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing & Actions Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Starting Price
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        ₹{tpl.offerPrice.toLocaleString("en-IN")}
                      </span>
                      {tpl.originalPrice > tpl.offerPrice && (
                        <span className="text-xs text-slate-400 line-through font-semibold">
                          ₹{tpl.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">/person</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] font-black border border-emerald-200/50">
                    Ready to Publish
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(tpl)}
                    className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} className="text-slate-400" /> Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTemplate(tpl)}
                    className="py-2.5 px-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-black transition-all shadow-brand flex items-center justify-center gap-1.5"
                  >
                    <Zap size={14} className="fill-white" /> Use Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
            onClick={() => setPreviewTemplate(null)}
          />
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[85vh] flex flex-col">
            {/* Header image banner */}
            <div className="relative h-48 w-full bg-slate-100">
              <img
                src={previewTemplate.coverImage}
                alt={previewTemplate.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/90 transition-all"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-white shadow">
                  {previewTemplate.tripType} • {previewTemplate.category}
                </span>
                <h3 className="text-2xl font-black text-white leading-tight">
                  {previewTemplate.title}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {previewTemplate.subtitle}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-bold">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
                  <span className="text-slate-900 dark:text-white">{previewTemplate.duration}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Fare / Person</span>
                  <span className="text-teal-600 dark:text-teal-400 text-sm font-black">₹{previewTemplate.offerPrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Fleet</span>
                  <span className="text-slate-900 dark:text-white">{previewTemplate.vehicleType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Stay Hotel</span>
                  <span className="text-slate-900 dark:text-white">{previewTemplate.hotels[0]?.name}</span>
                </div>
              </div>

              {/* Itinerary Preview */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Day-wise Timeline Itinerary ({previewTemplate.itinerary.length} Days)
                </h4>
                <div className="space-y-2 border-l-2 border-teal-500/30 ml-2 pl-4">
                  {previewTemplate.itinerary.map((day) => (
                    <div key={day.day} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex justify-between items-center font-black text-slate-900 dark:text-white">
                        <span>Day {day.day}: {day.startLocation} → {day.destination}</span>
                        <span className="text-[10px] text-teal-600 font-bold">{day.departureTime} - {day.arrivalTime}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{day.notes}</p>
                      {day.activities && day.activities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {day.activities.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[9px] font-bold">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 space-y-2">
                  <h5 className="font-black text-emerald-700 dark:text-emerald-400 uppercase text-[11px]">Included in Package</h5>
                  <ul className="space-y-1 text-[11px]">
                    {previewTemplate.includes.map((inc, i) => (
                      <li key={i} className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-300">
                        <Check size={12} className="text-emerald-500 shrink-0" /> {inc}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 space-y-2">
                  <h5 className="font-black text-rose-700 dark:text-rose-400 uppercase text-[11px]">Exclusions</h5>
                  <ul className="space-y-1 text-[11px]">
                    {previewTemplate.excludes.map((exc, i) => (
                      <li key={i} className="flex items-center gap-1.5 font-semibold text-rose-900 dark:text-rose-300">
                        • {exc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => {
                  const tpl = previewTemplate;
                  setPreviewTemplate(null);
                  onSelectTemplate(tpl);
                }}
                className="px-6 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-black shadow-brand flex items-center gap-2"
              >
                <Zap size={14} className="fill-white" /> Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
