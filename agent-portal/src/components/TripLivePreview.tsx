import React from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Bus,
  Hotel,
  Coffee,
  Users,
  ShieldCheck,
  Check,
  Sparkles,
  Tag,
  Star,
  Wifi,
  Wind,
  Tv,
  Zap,
  Info,
} from "lucide-react";

interface TripLivePreviewProps {
  formData: any;
  activeStep: number;
}

export const TripLivePreview: React.FC<TripLivePreviewProps> = ({ formData, activeStep }) => {
  const coverImage =
    formData.coverImages && formData.coverImages.length > 0
      ? formData.coverImages[0]
      : formData.coverImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";

  const title = formData.title || "Untitled Travel Package";
  const subtitle = formData.subtitle || "Premium Travel Experience";
  const tripType = formData.tripType || "Group Tour";
  const category = formData.category || "Premium";
  const originCity = formData.originCity || "Origin";
  const destinations = formData.destinations && formData.destinations.length > 0
    ? formData.destinations
    : ["Destination"];

  const startDate = formData.startDate || "YYYY-MM-DD";
  const endDate = formData.endDate || "YYYY-MM-DD";
  const duration = formData.duration || "Multi-Day Tour";

  const originalPrice = Number(formData.originalPrice) || 0;
  const offerPrice = Number(formData.offerPrice) || 0;
  const discountPercent =
    originalPrice > offerPrice && originalPrice > 0
      ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
      : 0;

  const totalSeats = Number(formData.totalSeats) || 40;
  const vehicleType = formData.vehicleType || "Bus";
  const busNumber = formData.busNumber || "";

  const hotelName = formData.hotels && formData.hotels[0]?.name ? formData.hotels[0].name : "Standard Stay";
  const hotelRating = formData.hotels && formData.hotels[0]?.category ? formData.hotels[0].category : "3 Star";

  const foodIncluded = formData.foodIncluded;
  const meals = formData.mealsIncluded || [];

  const amenities = formData.amenities || [];
  const hasAC = amenities.includes("AC") || (formData.busAmenities && formData.busAmenities.includes("AC"));

  return (
    <div className="sticky top-6 space-y-4">
      {/* Live Badge */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white text-xs font-bold backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="uppercase tracking-widest text-[10px] font-extrabold text-emerald-400">
            Live Preview
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">
          Customer Card View
        </span>
      </div>

      {/* Main Customer Card Mockup */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl transition-all duration-300 group">
        {/* Card Cover Header */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e: any) => {
              e.target.src =
                "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10 shadow-sm">
              {tripType} • {category}
            </span>
            {discountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-1.5 text-teal-300 text-[11px] font-bold mb-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{originCity} → {destinations.join(", ")}</span>
            </div>
            <h4 className="font-black text-base leading-tight text-white drop-shadow-sm line-clamp-1">
              {title}
            </h4>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Subtitle / Tagline */}
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px] line-clamp-2">
            {subtitle}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="truncate">{duration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
              <Users className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>{totalSeats} Seats</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold truncate">
              <Bus className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="truncate">{vehicleType} {hasAC && "(AC)"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold truncate">
              <Hotel className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="truncate">{hotelRating}</span>
            </div>
          </div>

          {/* Meals & Amenities Badges */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Package Highlights
            </span>
            <div className="flex flex-wrap gap-1">
              {foodIncluded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/50">
                  <Coffee className="w-3 h-3" /> Meals Included
                </span>
              )}
              {hasAC && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 text-[10px] font-bold border border-sky-200/50">
                  <Wind className="w-3 h-3" /> Air Conditioned
                </span>
              )}
              {amenities.slice(0, 3).map((am: string) => (
                <span
                  key={am}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold"
                >
                  {am}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing & Call to Action Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Starting From
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  ₹{offerPrice ? offerPrice.toLocaleString("en-IN") : "0"}
                </span>
                {originalPrice > offerPrice && (
                  <span className="text-xs text-slate-400 line-through font-semibold">
                    ₹{originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-medium">/person</span>
              </div>
            </div>

            <button
              type="button"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white shadow-sm hover:brightness-105 transition-all cursor-default"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Validation / Active Step Notice */}
      <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/50 text-[11px] text-teal-900 dark:text-teal-300 font-medium flex items-center gap-2.5 shadow-sm">
        <Sparkles className="w-4 h-4 shrink-0 text-teal-500" />
        <span>
          Editing <strong>Step {activeStep} of 7</strong>. Live changes update in card preview above.
        </span>
      </div>
    </div>
  );
};
