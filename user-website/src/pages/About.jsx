// src/pages/About.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Heart, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import logoImg from "../assets/logo.jpg";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-350" />
          </motion.button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">About</h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Traveloop App Info</p>
          </div>
        </div>

        {/* Brand Center Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 rounded-[28px] overflow-hidden shadow-[0_12px_40px_rgba(20,184,181,0.25)] border border-teal-150 p-0.5 bg-gradient-to-tr from-teal-500 to-cyan-400 mb-4"
          >
            <div className="w-full h-full rounded-[26px] overflow-hidden bg-white">
              <img src={logoImg} alt="Traveloop Logo" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <h2 className="text-3xl font-black bg-gradient-to-r from-teal-600 via-cyan-500 to-sky-500 bg-clip-text text-transparent">
            Traveloop
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">
            Version 1.0.0 (Release Candidate)
          </p>
        </div>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium text-center px-2">
          Traveloop is your ultimate companion for smart itinerary planning, budget tracking, live weather updates, and seamless group collaboration. Keep all your travel details synced in one place.
        </p>

        {/* Feature Highlights */}
        <div className="space-y-3 mb-8">
          {[
            { title: "Smart Explorer", desc: "Discover local attractions with AI suggestions", emoji: "🗺️" },
            { title: "Real-time Budgets", desc: "Log expense items and split settlements", emoji: "💰" },
            { title: "Flight Trackers", desc: "Monitor departure terminals and live delays", emoji: "✈️" },
            { title: "Collab Journals", desc: "Capture group memories and discuss via chat", emoji: "📝" }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.2 }}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60"
            >
              <span className="text-2xl">{feat.emoji}</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{feat.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Metadata */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col items-center gap-3">
          <div className="flex gap-4 text-xs font-bold text-slate-400">
            <button onClick={() => navigate("/terms-and-conditions")} className="hover:text-teal-600 transition-colors">
              Terms & Conditions
            </button>
            <span>•</span>
            <button onClick={() => navigate("/privacy")} className="hover:text-teal-600 transition-colors">
              Privacy Policy
            </button>
          </div>
        </div>

      </div>

      <div className="text-center mt-6 flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
          Made with <Heart size={10} className="text-rose-500 fill-rose-500" /> by the Traveloop Team
        </p>
        <p className="text-[9px] text-slate-400">© 2026 Traveloop Inc. All rights reserved.</p>
      </div>
    </div>
  );
};

export default About;
