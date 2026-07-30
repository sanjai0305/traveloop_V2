// src/layouts/AuthLayout.jsx

import React, { useEffect, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

// IMAGES
import LoginBg from "../assets/images/login-bg.jpg";
import logoImg from "../assets/logo.jpg";

const AuthLayout = ({ children }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE KEYBOARD VISIBILITY DETECTION
  // Prevents layout shifts when keyboard opens/closes
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      // On mobile, when keyboard is open, viewport height reduces
      const windowHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      const estimatedKeyboardHeight = Math.max(0, screenHeight - windowHeight);

      if (estimatedKeyboardHeight > 100) {
        // Keyboard is likely open
        setIsKeyboardVisible(true);
        setKeyboardHeight(estimatedKeyboardHeight);
      } else {
        // Keyboard is likely closed
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    window.addEventListener("resize", handleResize);
    
    // Check initial state
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-slate-900 flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        // Prevent layout shift when keyboard appears
        transition: isKeyboardVisible ? "none" : "all 0.3s ease-out",
        height: "100dvh", // Use dynamic viewport height
      }}
    >
      {/* ── HERO IMAGE SECTION (COLLAPSIBLE ON MOBILE WITH KEYBOARD) ── */}
      <div
        className="relative w-full flex-shrink-0 overflow-hidden transition-all duration-300"
        style={{
          height: isKeyboardVisible ? "140px" : "42vh",
          minHeight: isKeyboardVisible ? "140px" : "280px",
        }}
      >
        <img src={LoginBg} alt="Travel Background" className="absolute inset-0 w-full h-full object-cover" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/40 to-slate-900/85" />

        {/* Glow blobs */}
        <div className="absolute top-6 right-6 w-32 h-32 rounded-full blur-3xl opacity-75 transition-opacity duration-300" style={{ background: "rgba(20,184,181,0.25)", display: isKeyboardVisible ? "none" : "block" }} />
        <div className="absolute bottom-0 left-8 w-40 h-32 rounded-full blur-3xl opacity-75 transition-opacity duration-300" style={{ background: "rgba(20,184,181,0.20)", display: isKeyboardVisible ? "none" : "block" }} />

        {/* Floating logo icon */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-8 right-8 flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden"
          style={{ display: isKeyboardVisible ? "none" : "flex" }}
        >
          <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
        </motion.div>

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-8 left-6 right-6"
          style={{ display: isKeyboardVisible ? "none" : "block" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-white/10"
            >
              <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Traveloop</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
            Explore The World
            <br />
            <span style={{ background: "linear-gradient(90deg, #5EEAD4, #14B8B5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your Way
            </span>
          </h1>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
              <MapPin size={12} className="text-teal-300" />
              <span className="text-white text-xs font-medium">100+ Destinations</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
              <Star size={12} className="text-yellow-400" />
              <span className="text-white text-xs font-medium">10K+ Travelers</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── AUTH CARD (BOTTOM SHEET STYLE) ── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        className="flex-1 relative -mt-6 bg-white dark:bg-slate-900 rounded-t-[28px] shadow-xl overflow-y-auto"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
          // Use -webkit-overflow-scrolling for smooth scrolling on iOS
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="px-6 pt-2 pb-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;