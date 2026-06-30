// src/components/ai/AIAssistant.jsx
// Floating AI chat button + bottom sheet drawer

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Zap } from "lucide-react";
import { useLocation } from "react-router-dom";

const QUICK_ACTIONS = [
  { emoji: "🗺️", label: "Generate Itinerary",   prompt: "Generate a 5-day itinerary for Bali, Indonesia" },
  { emoji: "💰", label: "Budget Tips",           prompt: "How do I plan a trip under ₹50,000?" },
  { emoji: "🧳", label: "Packing List",          prompt: "What should I pack for a beach vacation?" },
  { emoji: "🌟", label: "Activity Ideas",        prompt: "What are the best activities for adventure travel?" },
];

const MOCK_RESPONSES = {
  default: "I'm Traveloop AI! I can help you plan itineraries, manage budgets, create packing lists, and find amazing activities. What would you like to explore? ✨",
  itinerary: "Here's a premium 5-day Bali itinerary:\n\n📅 Day 1 – Arrive in Ubud, rice terraces\n📅 Day 2 – Tanah Lot temple & sunset\n📅 Day 3 – Seminyak beach & spa\n📅 Day 4 – Mount Batur sunrise trek\n📅 Day 5 – Shopping & departure\n\nEstimated budget: ₹45,000–₹65,000 🌴",
  budget:    "Smart budget tips for ₹50,000:\n\n✅ Book flights 3+ months early\n✅ Stay in guesthouses (save 40%)\n✅ Eat local street food\n✅ Use public transport\n✅ Skip tourist traps\n\nDestinations to consider: Goa, Pondicherry, Manali, Coorg 🎯",
  packing:   "Beach vacation essentials:\n\n👙 Swimwear (2-3 sets)\n☀️ SPF 50+ sunscreen\n🕶️ Polarized sunglasses\n👟 Flip flops + walking shoes\n📱 Waterproof phone case\n💊 Motion sickness meds\n🔌 Universal adapter\n🎒 Dry bag for the beach\n\nPro tip: Roll clothes to save 30% space! 🧳",
  activities:"Top adventure activities:\n\n🪂 Paragliding – Bir Billing, HP\n🏄 Surfing – Varkala, Kerala\n🧗 Rock Climbing – Hampi\n🤿 Scuba Diving – Andamans\n🚵 Mountain Biking – Manali\n🦁 Wildlife Safari – Jim Corbett\n\nBook 48hrs in advance for best rates! 🌟",
};

const getResponse = (msg) => {
  const lower = msg.toLowerCase();
  if (lower.includes("itinerary") || lower.includes("bali")) return MOCK_RESPONSES.itinerary;
  if (lower.includes("budget") || lower.includes("₹"))        return MOCK_RESPONSES.budget;
  if (lower.includes("pack"))                                  return MOCK_RESPONSES.packing;
  if (lower.includes("activit"))                               return MOCK_RESPONSES.activities;
  return MOCK_RESPONSES.default;
};

const AIAssistant = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [messages, setMessages] = useState([
    { id: 1, role: "ai", text: MOCK_RESPONSES.default },
  ]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);

  // Handle android back button
  useEffect(() => {
    if (!isOpen) return;
    const handleHardwareBack = (e) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener("hardwareBack", handleHardwareBack);
    return () => {
      window.removeEventListener("hardwareBack", handleHardwareBack);
    };
  }, [isOpen, onClose]);

  const isAuthScreen = ["/", "/login", "/register", "/forgot-password", "/privacy", "/terms", "/terms-and-conditions"].some(
    path => location.pathname === path || location.pathname.startsWith(path + "/")
  );

  if (isAuthScreen) return null;

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    setTyping(false);
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, role: "ai", text: getResponse(text) },
    ]);
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => {/* handled externally */}}
            className="fixed z-40 w-14 h-14 rounded-full flex items-center justify-center ai-bubble shadow-brand"
            style={{
              bottom: "calc(96px + max(env(safe-area-inset-bottom), 12px))",
              right: "16px",
            }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={24} className="text-white" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-[32px] overflow-hidden"
              style={{
                maxHeight: "82vh",
                paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
              }}
            >
              {/* Header */}
              <div
                className="px-5 pt-4 pb-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #0F172A, #14B8B5)" }}
              >
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-base">Traveloop AI</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white/70 text-xs">Always online</span>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <X size={16} className="text-white" />
                </button>
              </div>

              {/* Messages */}
              <div className="px-4 py-4 overflow-y-auto flex flex-col gap-3" style={{ maxHeight: "42vh" }}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1 ai-bubble">
                        <Sparkles size={12} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-[18px] text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "text-white rounded-tr-[4px]"
                          : "bg-slate-50 text-slate-700 rounded-tl-[4px] border border-slate-100"
                      }`}
                      style={msg.role === "user" ? { background: "linear-gradient(135deg, #14B8B5, #0D9488)" } : {}}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {typing && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center ai-bubble">
                      <Sparkles size={12} className="text-white" />
                    </div>
                    <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-[18px] rounded-tl-[4px]">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-slate-300"
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-3">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {QUICK_ACTIONS.map(qa => (
                    <button
                      key={qa.label}
                      onClick={() => sendMessage(qa.prompt)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      <span>{qa.emoji}</span>
                      <span>{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="px-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-[18px] bg-slate-50 border border-slate-200 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
                  <Zap size={16} className="text-teal-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                    placeholder="Ask me anything about travel..."
                    className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                  >
                    <Send size={14} className="text-white" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
