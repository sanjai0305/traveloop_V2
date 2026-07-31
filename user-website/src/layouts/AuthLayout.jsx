// src/layouts/AuthLayout.jsx
import React from "react";
import { MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

// IMAGES
import LoginBg from "../assets/images/login-bg.jpg";
import logoImg from "../assets/logo.jpg";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
      
      {/* ── LEFT HERO SIDEBAR (DESKTOP ONLY, >=1024px) ── */}
      <div className="hidden lg:flex relative lg:w-[45%] xl:w-[40%] bg-slate-900 flex-col justify-between p-12 overflow-hidden flex-shrink-0">
        {/* Cover image */}
        <img
          src={LoginBg}
          alt="Travel Background"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/65 to-slate-950/90 z-10" />

        {/* Glow blobs */}
        <div className="absolute top-10 right-10 w-44 h-44 rounded-full blur-3xl opacity-30 bg-teal-500 z-10" />
        <div className="absolute bottom-20 left-10 w-44 h-44 rounded-full blur-3xl opacity-20 bg-blue-500 z-10" />

        {/* Floating logo icon */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 p-0.5">
            <img src={logoImg} alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight font-poppins">Traveloop</span>
        </div>

        {/* Hero content */}
        <div className="relative z-20 mt-auto space-y-6">
          <h1 className="text-4xl font-black text-white leading-tight font-poppins">
            Explore The World
            <br />
            <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Your Way
            </span>
          </h1>

          <p className="text-slate-350 text-sm leading-relaxed max-w-sm">
            Join thousands of travelers planning, exploring, and documenting their journeys worldwide.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
              <MapPin size={13} className="text-teal-300" />
              <span>100+ Destinations</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
              <Star size={13} className="text-yellow-400" />
              <span>10K+ Travelers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM CONTENT (RESPONSIVE) ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
        
        {/* Mobile top header branding (visible only on screens < 1024px) */}
        <div className="lg:hidden flex flex-col items-center mb-8 gap-2">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-brand">
            <img src={logoImg} alt="Logo" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <span className="text-slate-800 dark:text-white font-black text-xl font-poppins tracking-tight">Traveloop</span>
        </div>

        {/* Auth form container */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-850 p-6 sm:p-8">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;