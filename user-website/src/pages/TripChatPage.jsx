// src/pages/TripChatPage.jsx — Dedicated Full-Height Slack/Discord/WhatsApp Trip Chat Workspace

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import TripHeaderNav from "../components/trip/TripHeaderNav";
import Avatar from "../components/common/Avatar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/mobile/MobileToast";
import { getApiUrl } from "../utils/api";
import {
  MessageSquare, Send, Paperclip, Smile, Mic, Search, Pin,
  FileText, Image as ImageIcon, Volume2, CheckCheck, Users,
  Hash, Bell, Sparkles, ChevronRight, X
} from "lucide-react";

const ROOMS = [
  { id: "general", name: "general", icon: Hash, desc: "General group chatter" },
  { id: "announcements", name: "announcements", icon: Bell, desc: "Important updates" },
  { id: "budget", name: "budget-costs", icon: Hash, desc: "Expenses & splits" },
  { id: "flights", name: "flights-lodging", icon: Hash, desc: "Flight & hotel sync" },
];

const TripChatPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");

  const [messages, setMessages] = useState([
    {
      id: "m-1",
      sender: { name: "Traveloop Assistant", avatar: null, isAi: true },
      text: "Welcome to the group trip workspace! Chat with collaborators, share ticket passes, and discuss routes here.",
      timestamp: "10:00 AM",
      date: "Today",
      reactions: ["👋", "✈️"],
      pinned: true
    }
  ]);

  const [input, setInput] = useState("");
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
  }, [messages]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: { name: user?.name || "Me", email: user?.email, avatar: user?.avatar },
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: "Today",
      reactions: [],
      pinned: false
    };

    setMessages(prev => [...prev, newMsg]);
    setInput("");
  };

  const filteredMessages = messages.filter(m =>
    !searchQuery || m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout hideFooter={true}>
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-100 font-sans">
        
        {/* ── TOP NAV HEADER ── */}
        <TripHeaderNav trip={trip} tripId={tripId} activeFeature="chat" />

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── FULL VIEWPORT SAAS CHAT WORKSPACE (calc(100vh - 82px - 57px)) ── */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="flex-1 w-full max-w-[1440px] mx-auto flex overflow-hidden bg-white shadow-xl">
          
          {/* ── LEFT SIDEBAR (Channels & Members) ── */}
          <div className="w-72 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col justify-between p-4 hidden md:flex overflow-y-auto">
            <div className="space-y-6">
              {/* Trip Brand */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black">
                  <MessageSquare size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white truncate">{trip?.title || "Trip Chat"}</h3>
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">Live Synced Workspace</span>
                </div>
              </div>

              {/* Chat Channels List */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2 mb-2">Channels</span>
                {ROOMS.map((room) => {
                  const Icon = room.icon;
                  const active = activeRoom === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoom(room.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        active
                          ? "bg-cyan-500/20 text-cyan-400 font-extrabold border border-cyan-500/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon size={14} className={active ? "text-cyan-400" : "text-slate-500"} />
                      <span>#{room.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Collaborators List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Online Members</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                    <span className="font-extrabold truncate">{user?.name || "You"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">Encrypted Transport</span>
              <span className="text-[11px] font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <CheckCheck size={13} /> Active & Secured
              </span>
            </div>
          </div>

          {/* ── MAIN CHAT WORKSPACE (INDEPENDENT MESSAGES SCROLL) ── */}
          <div className="flex-1 flex flex-col justify-between bg-white min-w-0 h-full overflow-hidden">
            
            {/* Main Chat Header Bar (Fixed) */}
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <Hash className="w-5 h-5 text-cyan-500 shrink-0" />
                <h3 className="text-base font-black text-[#0F172A] truncate">#{activeRoom}</h3>
                <span className="text-xs text-[#64748B] font-medium hidden sm:inline">• Official Trip Channel</span>
              </div>

              {/* Message Search */}
              <div className="relative max-w-xs w-full hidden sm:block">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search channel messages..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0F172A] outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Pinned Messages Banner (Fixed) */}
            {messages.some(m => m.pinned) && (
              <div className="px-6 py-2 bg-cyan-50/80 border-b border-cyan-100 flex items-center gap-2 text-xs text-cyan-800 font-bold shrink-0">
                <Pin size={13} className="text-cyan-600 shrink-0" />
                <span className="truncate">Pinned: {messages.find(m => m.pinned)?.text}</span>
              </div>
            )}

            {/* Messages Scroll Area (ONLY THIS SCROLLS!) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {filteredMessages.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center mx-auto">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="text-lg font-black text-[#0F172A]">No messages in #{activeRoom} yet</h4>
                  <p className="text-xs text-[#64748B] font-medium max-w-xs mx-auto">
                    Be the first to start the conversation with your group members!
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3.5 group">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 mt-0.5">
                      <Avatar user={msg.sender} size={36} />
                    </div>

                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#0F172A]">{msg.sender.name}</span>
                        {msg.sender.isAi && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-[9px] font-black uppercase">AI Bot</span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400">{msg.timestamp}</span>
                      </div>

                      <div className="p-3.5 rounded-2xl rounded-tl-xs bg-slate-100 text-[#0F172A] text-xs font-medium leading-relaxed shadow-xs">
                        {msg.text}
                      </div>

                      {/* Reactions Pill */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex gap-1 pt-1">
                          {msg.reactions.map((emoji, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs shadow-2xs">
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Fixed Message Composer Box */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 z-20">
              <form onSubmit={handleSend} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-cyan-400 transition-colors">
                <div className="flex items-center gap-1 text-slate-400 pl-2">
                  <button type="button" className="p-1.5 hover:text-cyan-600 transition-colors cursor-pointer" title="Attach file">
                    <Paperclip size={18} />
                  </button>
                  <button type="button" className="p-1.5 hover:text-cyan-600 transition-colors cursor-pointer" title="Insert emoji">
                    <Smile size={18} />
                  </button>
                </div>

                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Message #${activeRoom}...`}
                  className="flex-1 bg-transparent text-xs font-bold text-[#0F172A] outline-none px-2"
                />

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white flex items-center justify-center shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  );
};

export default TripChatPage;
