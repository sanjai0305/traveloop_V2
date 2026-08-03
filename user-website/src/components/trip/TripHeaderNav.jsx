// src/components/trip/TripHeaderNav.jsx — Top Navigation Bar for Trip Sub-Pages

import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Users, Calendar, Sparkles, MapPin, Compass, MessageSquare, Plane, ListTodo, ShieldCheck, Bot } from "lucide-react";

const TripHeaderNav = ({ trip, tripId, activeFeature }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tripTitle = trip?.title || trip?.destination || "Trip Details";
  const tripStatus = trip?.status || "Active";
  const startDate = trip?.startDate ? new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  const endDate = trip?.endDate ? new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  const datesText = startDate && endDate ? `${startDate} - ${endDate}` : "Flexible Dates";
  const membersCount = (trip?.collaborators?.length || 0) + 1;

  const NAV_ACTIONS = [
    { id: "itinerary",     label: "Itinerary",     icon: ListTodo,     path: `/build-itinerary/${tripId}` },
    { id: "collaboration", label: "Collaboration", icon: Users,        path: `/trips/${tripId}/collaboration` },
    { id: "flights",       label: "Flights",       icon: Plane,        path: `/trips/${tripId}/flights` },
    { id: "chat",          label: "Trip Chat",     icon: MessageSquare,path: `/trips/${tripId}/chat` },
    { id: "assistant",     label: "AI Assistant",  icon: Bot,          path: `/trips/${tripId}/assistant` },
  ];

  return (
    <div className="w-full bg-white border-b border-slate-200/80 shadow-xs sticky top-0 z-30 font-sans">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left Info Group */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/build-itinerary/${tripId}`)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-black shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Trip</span>
          </button>

          <div className="h-6 w-px bg-slate-200 shrink-0" />

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-[#0F172A] truncate">{tripTitle}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                {tripStatus}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#64748B] font-semibold flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-cyan-500" />
                {datesText}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users size={12} className="text-cyan-500" />
                {membersCount} {membersCount === 1 ? "Member" : "Members"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Feature Quick Actions Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-full border border-slate-200/60 overflow-x-auto hide-scrollbar shrink-0">
          {NAV_ACTIONS.map((nav) => {
            const Icon = nav.icon;
            const active = activeFeature === nav.id || location.pathname === nav.path;
            return (
              <Link
                key={nav.id}
                to={nav.path}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  active
                    ? "bg-white text-cyan-600 shadow-sm border border-slate-200/60 font-black"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/60"
                }`}
              >
                <Icon size={14} className={active ? "text-cyan-500" : "text-slate-400"} />
                <span>{nav.label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default TripHeaderNav;
