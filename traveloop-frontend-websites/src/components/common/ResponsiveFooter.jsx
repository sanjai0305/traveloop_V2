// src/components/common/ResponsiveFooter.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Compass, Mail, Phone, MapPin, Globe, Shield } from "lucide-react";

const ResponsiveFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-850/80 text-slate-500 dark:text-slate-400 py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP LAYOUT - GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand & Description */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-brand">
                <div className="w-full h-full rounded-[6px] overflow-hidden bg-white flex items-center justify-center font-bold text-teal-600 text-sm">
                  ✈️
                </div>
              </div>
              <span className="font-poppins font-black text-lg bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent tracking-tight">
                Traveloop
              </span>
            </Link>
            <p className="text-xs font-semibold leading-relaxed text-slate-450 dark:text-slate-500">
              Your ultimate companion for seamless trip planning, itinerary creation, budget splitting, and curated explore recommendations. Plan your next adventure with confidence.
            </p>
            <div className="flex gap-4 mt-2">
              <span className="text-slate-400 dark:text-slate-650 hover:text-teal-500 cursor-pointer transition-colors"><Globe size={18} /></span>
              <span className="text-slate-400 dark:text-slate-650 hover:text-teal-500 cursor-pointer transition-colors"><Shield size={18} /></span>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Discover</h4>
            <div className="flex flex-col gap-2 text-xs font-bold text-slate-450 dark:text-slate-500">
              <Link to="/activities" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Trending Places</Link>
              <Link to="/my-trips" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Popular Itineraries</Link>
              <Link to="/create-trip" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Plan new Trip</Link>
            </div>
          </div>

          {/* Column 3: Legal & Terms */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Legal</h4>
            <div className="flex flex-col gap-2 text-xs font-bold text-slate-450 dark:text-slate-500">
              <Link to="/terms-and-conditions" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy Policy</Link>
              <Link to="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">About Us</Link>
            </div>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Support</h4>
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-450 dark:text-slate-500">
              <div className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> support@traveloop.co</div>
              <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> +91 (800) TRAVELOOP</div>
              <div className="flex items-center gap-2"><MapPin size={13} className="text-slate-400" /> Bangalore, India</div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div className="border-t border-slate-200/60 dark:border-slate-850/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-600 text-center sm:text-left">
            © {currentYear} Traveloop Technologies. All rights reserved.
          </p>
          <div className="flex gap-6 text-[11px] font-bold text-slate-450 dark:text-slate-650">
            <Link to="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms-and-conditions" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Help</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default ResponsiveFooter;
