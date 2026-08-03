// src/components/about/AboutSection.jsx — Desktop-First SaaS About Component

import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles, ShieldCheck, Cpu, Globe, Rocket, Terminal,
  Zap, Heart, Code, ExternalLink, HelpCircle, FileText,
  Lock, CheckCircle2, Server, Database, Cloud, Compass,
  DollarSign, Plane, BookOpen, Sun, Users, WifiOff, Layers
} from "lucide-react";
import logoImg from "../../assets/logo.jpg";

const FEATURES = [
  { icon: Sparkles, color: "#06B6D4", title: "AI Trip Planner", desc: "Instant AI route generation and itinerary optimization tailored to your travel style." },
  { icon: DollarSign, color: "#10B981", title: "Budget Manager", desc: "Real-time expense logging, split settlements, and currency budget limits." },
  { icon: Plane, color: "#2563EB", title: "Flight Tracker", desc: "Live departure gate alerts, terminal tracking, and delay advisories." },
  { icon: BookOpen, color: "#8B5CF6", title: "Travel Journal", desc: "Capture group memories, flight passes, handwritten notes, and photo logs." },
  { icon: Sun, color: "#F59E0B", title: "Weather Intelligence", desc: "Live weather warnings, severe storm advisories, and hourly trip forecasts." },
  { icon: Users, color: "#EC4899", title: "Group Collaboration", desc: "Shared trip links, real-time collaborator chat, and itinerary voting." },
  { icon: WifiOff, color: "#64748B", title: "Offline Support", desc: "Full offline access to saved itineraries, packing lists, and local notes." },
  { icon: ShieldCheck, color: "#14B8A6", title: "Secure Cloud Sync", desc: "End-to-end encrypted backup across all your mobile and desktop devices." },
];

const TECH_STACK = [
  { name: "React 18", category: "Frontend Framework", color: "#61DAFB" },
  { name: "Vite 8", category: "Build Tooling", color: "#646CFF" },
  { name: "Firebase Auth", category: "SMS & OTP Auth", color: "#FFCA28" },
  { name: "Node.js", category: "Backend Runtime", color: "#339933" },
  { name: "MongoDB", category: "Database Engine", color: "#47A248" },
  { name: "Google Maps API", category: "Location Services", color: "#4285F4" },
  { name: "OpenWeather API", category: "Weather Intelligence", color: "#EB6E4B" },
  { name: "Socket.IO", category: "Real-Time WebSocket", color: "#010101" },
];

const AboutSection = () => {
  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-10 text-[#0F172A] font-sans">
      
      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── HERO SECTION (2-Column Desktop Grid) ─────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="rounded-[32px] bg-gradient-to-br from-white via-sky-50/70 to-cyan-50/50 border border-slate-900/[0.06] shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-8 sm:p-12 overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-cyan-400 via-teal-500 to-blue-600 p-0.5 shadow-xl shadow-cyan-500/20 shrink-0">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-white">
                  <img src={logoImg} alt="Traveloop Logo" className="w-full h-full object-cover" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0F172A]">Traveloop</h1>
                  <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-black border border-cyan-200">
                    v1.4.2 Production
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Enterprise Travel Console</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black leading-tight text-[#0F172A]">
              Your AI-powered travel planning companion.
            </h2>
            <p className="text-slate-500 text-base font-medium leading-relaxed max-w-xl">
              Traveloop unifies intelligent itinerary generation, budget tracking, real-time weather advisories, and group collaboration into a single sleek SaaS platform.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#release-notes"
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 flex items-center justify-center gap-2 transition-all"
              >
                <Terminal size={14} />
                <span>View Release Notes</span>
              </a>

              <Link
                to="/profile"
                className="h-11 px-6 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle size={14} />
                <span>Contact Support</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Artwork */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-video rounded-[24px] overflow-hidden shadow-2xl border border-white/60 group">
              <img
                src="/assets/cards/create_trip_card.png"
                alt="Traveloop Dashboard Artwork"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">Next-Gen SaaS</span>
                <p className="text-sm font-black mt-1">Smart Holographic Route Generator</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── ABOUT TRAVELOOP SUMMARY CARD ──────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-8 space-y-4 text-left">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Compass size={20} />
          </div>
          <div>
            <h3 className="text-[22px] font-black text-[#0F172A]">About Traveloop Platform</h3>
            <p className="text-xs text-[#64748B] font-medium">Reimagining global journey management through modern web architecture</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
          Designed for modern travelers, digital nomads, and trip leaders, Traveloop combines advanced AI recommendations with real-time WebSocket sync to eliminate the hassle of multi-app trip coordination. Whether planning a solo backpacking journey or managing an international group expedition, Traveloop keeps your budget, itinerary, packing checklists, and live advisories perfectly in sync.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {[
            { title: "AI Itineraries", icon: Sparkles, color: "#06B6D4" },
            { title: "Live Budgets", icon: DollarSign, color: "#10B981" },
            { title: "Group Sync", icon: Users, color: "#2563EB" },
            { title: "Cloud Backup", icon: Cloud, color: "#8B5CF6" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <Icon size={18} style={{ color: item.color }} />
                <span className="text-xs font-extrabold text-[#0F172A]">{item.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── FEATURES GRID (2 Rows × 4 Columns = 8 Cards) ─────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-500" />
          <h3 className="text-[22px] font-black text-[#0F172A]">Core Platform Features</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -6 }}
                className="p-6 rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.15)] flex flex-col items-start gap-3 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${f.color}15` }}>
                  <Icon size={22} style={{ color: f.color }} />
                </div>
                <h4 className="text-base font-extrabold text-[#0F172A]">{f.title}</h4>
                <p className="text-xs text-[#64748B] font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── TECH STACK CARD ───────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-8 space-y-6 text-left">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-[22px] font-black text-[#0F172A]">Technology Stack</h3>
            <p className="text-xs text-[#64748B] font-medium">Powered by industry-leading open source libraries and cloud infrastructure</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TECH_STACK.map((tech) => (
            <div key={tech.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col space-y-1">
              <span className="text-sm font-extrabold text-[#0F172A]">{tech.name}</span>
              <span className="text-[11px] font-semibold text-[#64748B]">{tech.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── OUR MISSION CARD ──────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-8 sm:p-10 shadow-xl space-y-4 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
          <Rocket size={13} /> Our Mission
        </div>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
          Empowering everyone to explore the world without friction.
        </h3>
        <p className="text-white/85 text-sm sm:text-base font-medium leading-relaxed max-w-3xl">
          We believe travel expands horizons and builds lifelong human connections. Our mission is to harness modern artificial intelligence and real-time collaborative technology to make travel planning effortless, accessible, and enjoyable for travelers worldwide.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── VERSION INFORMATION & SYSTEM HEALTH GRID ──────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div id="release-notes" className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-8 space-y-6 text-left">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Server size={20} />
          </div>
          <div>
            <h3 className="text-[22px] font-black text-[#0F172A]">Version Information & System Health</h3>
            <p className="text-xs text-[#64748B] font-medium">Build metadata and live cloud API operational status</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[#64748B] font-bold block">Version</span>
            <span className="text-sm font-black text-[#0F172A] mt-0.5 block">v1.4.2</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[#64748B] font-bold block">Build ID</span>
            <span className="text-sm font-black text-[#0F172A] mt-0.5 block font-mono">2026.08.03</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[#64748B] font-bold block">Release Date</span>
            <span className="text-sm font-black text-[#0F172A] mt-0.5 block">August 2026</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[#64748B] font-bold block">Environment</span>
            <span className="text-sm font-black text-cyan-600 mt-0.5 block">Production</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[#64748B] font-bold block">API Gateway</span>
            <span className="text-sm font-black text-emerald-600 mt-0.5 block">🟢 99.9% Uptime</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[#64748B] font-bold block">Database</span>
            <span className="text-sm font-black text-emerald-600 mt-0.5 block">🟢 Healthy</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── LEGAL & RESOURCES ─────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center gap-2 text-slate-500">
          <FileText size={16} className="text-cyan-500" />
          <span>Legal & Compliance Documentation</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/privacy-policy" className="text-[#0F172A] hover:text-cyan-600 transition-colors">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="text-[#0F172A] hover:text-cyan-600 transition-colors">Terms of Service</Link>
          <span className="text-slate-400">Open Source Licenses</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── FOOTER BANNER ─────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B] font-medium">
        <div className="flex items-center gap-2">
          <span>Traveloop © 2026 Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4 font-bold">
          <a href="https://traveloop.app" target="_blank" rel="noreferrer" className="hover:text-cyan-600 flex items-center gap-1">
            Website <ExternalLink size={12} />
          </a>
          <Link to="/profile" className="hover:text-cyan-600">Support</Link>
          <span className="hover:text-cyan-600 cursor-pointer">GitHub</span>
          <a href="mailto:support@traveloop.app" className="hover:text-cyan-600">Email Us</a>
        </div>
      </div>

    </div>
  );
};

export default AboutSection;
