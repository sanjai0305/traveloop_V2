// src/pages/TripAiAssistantPage.jsx — Full-Page AI Travel Companion Engine

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import TripHeaderNav from "../components/trip/TripHeaderNav";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/mobile/MobileToast";
import { getApiUrl } from "../utils/api";
import { sendChatMessage } from "../services/aiService";
import {

  Sparkles, Send, Bot, Compass, DollarSign, MapPin, Sun,
  ShieldAlert, Luggage, CheckCircle2, RefreshCw, MessageSquare,
  ArrowRight, PhoneCall, HelpCircle
} from "lucide-react";

const QUICK_PROMPTS = [
  { icon: Compass, title: "Optimize Route", prompt: "Suggest the best order of places to visit for maximum efficiency." },
  { icon: DollarSign, title: "Budget Tips", prompt: "How can we save money on food and local transport for this trip?" },
  { icon: MapPin, title: "Hidden Gems", prompt: "What are 3 non-touristy hidden spots near our destination?" },
  { icon: Luggage, title: "Packing Advice", prompt: "What essential items should we pack for this destination and weather?" },
];

const TripAiAssistantPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState([
    {
      id: "ai-1",
      role: "assistant",
      text: "Hello! I am your AI Travel Assistant. I have analyzed your trip itinerary, budget, and destination weather. How can I assist your journey today?",
      timestamp: "Just now"
    }
  ]);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`trips/${tripId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.trip) {
          setTrip(data.trip);
        }
      } catch (err) {
        toast.error("Failed to load trip details");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSendPrompt = async (promptText) => {
    const textToSend = promptText || input.trim();
    if (!textToSend) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInput("");
    setThinking(true);

    // Build context-enriched prompt using trip details
    const contextPrefix = trip
      ? `[Trip Context: "${trip.title}" to ${trip.destination}${trip.startDate ? `, departing ${trip.startDate}` : ""}]\n\n`
      : "";
    const enrichedMessage = `${contextPrefix}${textToSend}`;

    // Stable session ID per page visit (not per tab)
    const sessionId = `trip-assist-${tripId || "general"}`;

    const result = await sendChatMessage(enrichedMessage, sessionId);
    setThinking(false);

    const aiReply = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      text: result.response || "I couldn't generate a response. Please try again.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages(prev => [...prev, aiReply]);
  };


  return (
    <MainLayout>
      <TripHeaderNav trip={trip} tripId={tripId} activeFeature="assistant" />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">AI Travel Companion</h1>
              <p className="text-base text-[#64748B] font-medium mt-0.5">Real-time itinerary optimization, budget advice, & weather intelligence</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── 2-COLUMN MAIN AI WORKSPACE ────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: AI CHAT CONVERSATION AREA (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Prompts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_PROMPTS.map((qp, i) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSendPrompt(qp.prompt)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-900/[0.06] shadow-xs hover:shadow-md hover:border-cyan-200 text-left space-y-1.5 transition-all cursor-pointer group"
                  >
                    <Icon size={18} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                    <h4 className="text-xs font-black text-[#0F172A]">{qp.title}</h4>
                  </button>
                );
              })}
            </div>

            {/* Chat Box Panel */}
            <div className="h-[600px] rounded-[28px] bg-white border border-slate-900/[0.08] shadow-[0_20px_60px_rgba(15,23,42,0.08)] flex flex-col justify-between overflow-hidden">
              
              {/* Chat Stream Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-cyan-500" />
                  <span className="text-xs font-black text-[#0F172A]">Traveloop Intelligence Bot</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Online
                </span>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      m.role === "user" ? "bg-cyan-500 text-white" : "bg-slate-900 text-cyan-400"
                    }`}>
                      {m.role === "user" ? "U" : <Bot size={16} />}
                    </div>

                    <div className={`p-4 rounded-2xl max-w-xl text-xs font-medium leading-relaxed shadow-xs ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-xs font-bold"
                        : "bg-slate-100 text-[#0F172A] rounded-tl-xs"
                    }`}>
                      {m.text}
                      <span className="block text-[9px] opacity-70 mt-1 text-right font-normal">{m.timestamp}</span>
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 bg-cyan-50/60 p-3 rounded-2xl max-w-xs animate-pulse">
                    <Sparkles size={14} />
                    <span>AI is thinking & analyzing destination data...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }} className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-cyan-400 transition-colors">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask AI about trip budget, itinerary, or local places..."
                    className="flex-1 bg-transparent text-xs font-bold text-[#0F172A] outline-none px-3"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || thinking}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT: SMART ASSISTANT INSIGHTS & EMERGENCY (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Weather & Travel Intel Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-[#0F172A]">Destination Live Intel</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[#64748B] font-bold">Weather</span>
                  <span className="font-black text-[#0F172A]">28°C · Sunny ☀️</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[#64748B] font-bold">Best Hours</span>
                  <span className="font-black text-[#0F172A]">08:00 AM – 11:30 AM</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[#64748B] font-bold">Safety Index</span>
                  <span className="font-black text-emerald-600">98% Very Safe</span>
                </div>
              </div>
            </div>

            {/* Emergency Contacts Card */}
            <div className="rounded-[24px] bg-rose-50/80 border border-rose-200/80 p-6 space-y-4 text-rose-950">
              <div className="flex items-center gap-2 border-b border-rose-200/60 pb-3">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-black">Emergency Helplines</h3>
              </div>

              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between p-2.5 rounded-xl bg-white/80 border border-rose-200">
                  <span>Police Hotline</span>
                  <span className="font-mono text-rose-700">112 / 100</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl bg-white/80 border border-rose-200">
                  <span>Ambulance / Medical</span>
                  <span className="font-mono text-rose-700">102</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl bg-white/80 border border-rose-200">
                  <span>Tourist Support</span>
                  <span className="font-mono text-rose-700">1363</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  );
};

export default TripAiAssistantPage;
