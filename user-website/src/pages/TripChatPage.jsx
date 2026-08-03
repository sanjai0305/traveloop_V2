// src/pages/TripChatPage.jsx — Full Enterprise Real-Time Trip Collaboration Workspace

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import TripHeaderNav from "../components/trip/TripHeaderNav";
import Avatar from "../components/common/Avatar";
import VoiceRecorder from "../components/chat/VoiceRecorder";
import LiveLocationMap from "../components/chat/LiveLocationMap";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/mobile/MobileToast";
import { getApiUrl } from "../utils/api";
import { socket } from "../utils/socket";
import {
  MessageSquare, Send, Paperclip, Smile, Mic, Search, Pin,
  FileText, Image as ImageIcon, Volume2, CheckCheck, Users,
  Hash, Bell, Sparkles, ChevronRight, X, MapPin, DollarSign,
  BarChart2, Navigation, ExternalLink, Download, Eye, ThumbsUp,
  Heart, Flame, AlertCircle, RefreshCw, Loader2, Play, Pause,
  Share2, CheckCircle2, CornerDownRight, QrCode
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CHANNELS = [
  { id: "general",       name: "general",        icon: Hash,    desc: "General group discussion" },
  { id: "announcements", name: "announcements",  icon: Bell,    desc: "Important trip announcements" },
  { id: "budget",        name: "budget-costs",   icon: DollarSign, desc: "Expenses & payment splits" },
  { id: "flights",       name: "flights-lodging",icon: Hash,    desc: "Flights, hotels & tickets" },
];

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥"];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TripChatPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast    = useToast();
  const { user } = useAuth();

  // Core State
  const [trip,            setTrip]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [activeChannel,   setActiveChannel]   = useState("general");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [messages,        setMessages]        = useState([]);
  const [inputText,       setInputText]       = useState("");
  const [replyingTo,      setReplyingTo]      = useState(null);
  const [onlineMembers,   setOnlineMembers]   = useState(new Set());
  const [activeLocations, setActiveLocations] = useState([]);

  // Feature Modals & Toggles
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showPollModal,     setShowPollModal]     = useState(false);
  const [showExpenseModal,  setShowExpenseModal]  = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMediaDrawer,   setShowMediaDrawer]   = useState(false);
  const [mediaCategory,     setMediaCategory]     = useState("all");
  const [sharedMediaItems,  setSharedMediaItems]  = useState([]);
  const [lightboxImage,     setLightboxImage]     = useState(null);
  const [isAiLoading,       setIsAiLoading]       = useState(false);
  const [typingUsers,       setTypingUsers]       = useState(new Set());

  // Form states
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions,  setPollOptions]  = useState(["", ""]);
  const [expTitle,     setExpTitle]     = useState("");
  const [expAmount,    setExpAmount]    = useState("");
  const [expUpiQr,     setExpUpiQr]     = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

  const authUserId = user?._id || user?.id;

  // ── Fetch Messages ─────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (silent = false) => {
    if (!tripId) return;
    if (!silent) setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/${tripId}?room=${activeChannel}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("[FetchMessages Error]:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tripId, activeChannel]);

  // Fetch Trip details
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`trips/${tripId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (data.success && data.trip) setTrip(data.trip);
      } catch (_) {}
    };
    fetchTrip();
  }, [tripId]);

  useEffect(() => { fetchMessages(false); }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Socket Events ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!tripId || !user) return;

    socket.emit("chat:join", { tripId, user: { id: authUserId, name: user.firstName || user.name } });

    const handleNewMessage = (msg) => {
      if (msg.tripId === tripId && (msg.room === activeChannel || msg.room === "general")) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };

    const handleEdit = ({ messageId, message, editedAt }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, message, editedAt } : m));
    };

    const handleDelete = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleTyping = ({ user: tUser }) => {
      if (tUser && tUser.name) {
        setTypingUsers(prev => new Set(prev).add(tUser.name));
      }
    };

    const handleStopTyping = ({ user: tUser }) => {
      if (tUser && tUser.name) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(tUser.name);
          return updated;
        });
      }
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:reaction", handleReaction);
    socket.on("chat:edit", handleEdit);
    socket.on("chat:delete", handleDelete);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:stopTyping", handleStopTyping);

    return () => {
      socket.emit("chat:leave", { tripId });
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:reaction", handleReaction);
      socket.off("chat:edit", handleEdit);
      socket.off("chat:delete", handleDelete);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:stopTyping", handleStopTyping);
    };
  }, [tripId, user, activeChannel, authUserId]);

  // ── Send Standard Message ──────────────────────────────────────────────────

  const handleSendText = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    // Check for AI Assistant prompt
    if (text.startsWith("/ai ") || text.toLowerCase().includes("@ai")) {
      handleAskAi(text.replace("/ai ", "").replace("@ai", "").trim());
      setInputText("");
      return;
    }

    const payload = {
      room: activeChannel,
      message: text,
      messageType: "text",
      replyTo: replyingTo?._id || null,
      replyToDetails: replyingTo ? {
        messageId: replyingTo._id,
        senderName: replyingTo.senderName,
        messageText: replyingTo.message
      } : null,
    };

    setInputText("");
    setReplyingTo(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/${tripId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.message]);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("[SendText Error]:", err);
      toast.error("Network error sending message");
    }
  };

  // ── AI Assistant Call ──────────────────────────────────────────────────────

  const handleAskAi = async (question) => {
    if (!question) return;
    setIsAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/${tripId}/ai`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.aiMessage]);
      }
    } catch (err) {
      console.error("[AskAi Error]:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Emoji Reaction Handler ─────────────────────────────────────────────────

  const handleReact = async (messageId, emoji) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/message/${messageId}/react`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions: data.reactions } : m));
      }
    } catch (err) {
      console.error("[React Error]:", err);
    }
  };

  // ── Send File / Photo Upload ───────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let messageType = "document";
    if (file.type.startsWith("image/")) messageType = "image";
    else if (file.type.startsWith("video/")) messageType = "video";
    else if (file.type.startsWith("audio/")) messageType = "audio";

    // Create client-side preview URL
    const previewUrl = URL.createObjectURL(file);

    const payload = {
      room: activeChannel,
      message: `Shared file: ${file.name}`,
      messageType,
      fileUrl: previewUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/${tripId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.message]);
        toast.success(`Uploaded ${file.name}!`);
      }
    } catch (err) {
      toast.error("File upload failed");
    }
  };

  // ── Send Voice Note ────────────────────────────────────────────────────────

  const handleSendVoiceNote = async ({ url, duration }) => {
    setShowVoiceRecorder(false);
    const payload = {
      room: activeChannel,
      message: `Voice Note (${duration}s)`,
      messageType: "audio",
      fileUrl: url,
      fileName: "voice_note.webm",
      fileType: "audio/webm",
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/${tripId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (_) {}
  };

  // ── Send Poll ──────────────────────────────────────────────────────────────

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;
    const validOpts = pollOptions.filter(o => o.trim());
    if (validOpts.length < 2) { toast.error("Please add at least 2 poll options"); return; }

    const payload = {
      room: activeChannel,
      message: `Poll: ${pollQuestion}`,
      messageType: "poll",
      poll: {
        question: pollQuestion,
        options: validOpts.map((opt, i) => ({ id: `opt-${i}`, text: opt, votes: [] })),
        isClosed: false,
      },
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/${tripId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.message]);
        setShowPollModal(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
      }
    } catch (_) {}
  };

  const handleVotePoll = async (messageId, optionId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/poll/${messageId}/vote`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, poll: data.poll } : m));
      }
    } catch (_) {}
  };

  // ── Send Expense Request ───────────────────────────────────────────────────

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;

    const payload = {
      room: "budget",
      message: `Expense Split Request: ${expTitle} (₹${expAmount})`,
      messageType: "expense",
      expense: {
        title: expTitle,
        amount: parseFloat(expAmount),
        currency: "INR",
        status: "pending",
        upiQr: expUpiQr || "",
      },
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/${tripId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.message]);
        setShowExpenseModal(false);
        setExpTitle("");
        setExpAmount("");
      }
    } catch (_) {}
  };

  const handleMarkExpensePaid = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`chat/expense/${messageId}/pay`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, expense: data.expense } : m));
        toast.success("Marked expense as paid!");
      }
    } catch (_) {}
  };

  // ── Share GPS Location ─────────────────────────────────────────────────────

  const handleShareLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const payload = {
          room: activeChannel,
          message: "Sharing live GPS location",
          messageType: "live_location",
          location: {
            name: "Current GPS Location",
            lat: latitude,
            lng: longitude,
            isLive: true,
            duration: "15m",
            speed: speed || 0,
          },
        };

        try {
          const token = localStorage.getItem("token");
          const res = await fetch(getApiUrl(`chat/${tripId}`), {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.success) {
            setMessages(prev => [...prev, data.message]);
            toast.success("Sharing live GPS location!");
          }
        } catch (_) {}
      },
      (err) => toast.error("Failed to fetch GPS coordinates")
    );
  };

  // Filter messages by search query
  const filteredMessages = messages.filter(m =>
    !searchQuery ||
    m.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedMessages = messages.filter(m => m.announcement?.isPinned || m.messageType === "announcement");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <MainLayout hideFooter={true}>
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900 font-sans text-white">
        
        {/* Top Trip Header Nav */}
        <TripHeaderNav trip={trip} tripId={tripId} activeFeature="chat" />

        {/* ── SAAS WORKSPACE CONTAINER ── */}
        <div className="flex-1 w-full max-w-[1440px] mx-auto flex overflow-hidden bg-slate-950 shadow-2xl border-t border-slate-800">
          
          {/* ── LEFT SIDEBAR: Channels & Members ── */}
          <div className="w-72 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col justify-between p-4 hidden md:flex overflow-y-auto">
            <div className="space-y-6">
              
              {/* Trip Brand */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black shadow-md">
                  <MessageSquare size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white truncate">{trip?.title || "Trip Chat"}</h3>
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">Live Synced Workspace</span>
                </div>
              </div>

              {/* Channels List */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2 mb-2">Channels</span>
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const active = activeChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannel(ch.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        active
                          ? "bg-cyan-500/20 text-cyan-400 font-extrabold border border-cyan-500/30 shadow-xs"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={15} className={active ? "text-cyan-400" : "text-slate-500"} />
                        <span>#{ch.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Collaborator Tools</span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setShowPollModal(true)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <BarChart2 size={14} className="text-cyan-400" /> Create Poll
                  </button>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <DollarSign size={14} className="text-emerald-400" /> Split Expense Request
                  </button>
                  <button
                    onClick={handleShareLiveLocation}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Navigation size={14} className="text-amber-400" /> Share Live Location
                  </button>
                </div>
              </div>

            </div>

            {/* AI Assistant shortcut */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => handleAskAi("What is the weather and packing advice for our trip?")}
                disabled={isAiLoading}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 flex items-center gap-2.5 transition-all hover:bg-cyan-500/30 cursor-pointer"
              >
                <Sparkles size={16} className="text-cyan-400 animate-pulse" />
                <span>{isAiLoading ? "Asking AI..." : "Ask Traveloop AI"}</span>
              </button>
            </div>
          </div>

          {/* ── CENTER: Chat Messages Viewport ── */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-950">
            
            {/* Channel Top Header */}
            <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Hash className="text-cyan-400" size={20} />
                <div>
                  <h3 className="text-base font-black text-white">#{CHANNELS.find(c => c.id === activeChannel)?.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{CHANNELS.find(c => c.id === activeChannel)?.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block w-48">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search chat..."
                    className="w-full h-8 pl-8 pr-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={() => setShowMediaDrawer(!showMediaDrawer)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Shared Media & Files"
                >
                  <Paperclip size={16} />
                </button>
              </div>
            </div>

            {/* Pinned Announcement Header */}
            {pinnedMessages.length > 0 && (
              <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Pin size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">
                    <strong>Announcement:</strong> {pinnedMessages[pinnedMessages.length - 1].message}
                  </span>
                </div>
              </div>
            )}

            {/* ── MESSAGES LIST SCROLLABLE AREA ── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="text-base font-black text-slate-300">No messages in #{activeChannel} yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm">Be the first collaborator to start the conversation!</p>
                </div>
              ) : (
                filteredMessages.map((m, idx) => {
                  const isMe = m.sender === authUserId || m.sender === user?._id;
                  const isAi = m.messageType === "ai" || m.sender === "ai-assistant";

                  return (
                    <div key={m._id || idx} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        <Avatar user={{ name: m.senderName, avatar: m.senderAvatar }} size={36} />
                      </div>

                      {/* Content Card */}
                      <div className={`space-y-1.5 max-w-lg ${isMe ? "items-end text-right" : ""}`}>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-slate-200">{m.senderName}</span>
                          <span className="text-[10px] text-slate-500">{new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        {/* Reply indicator */}
                        {m.replyToDetails && (
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
                            <CornerDownRight size={12} className="text-cyan-400 shrink-0" />
                            <span className="truncate">Replying to <strong>{m.replyToDetails.senderName}</strong>: {m.replyToDetails.messageText}</span>
                          </div>
                        )}

                        {/* Message Types */}
                        <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                          isAi
                            ? "bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/30 text-cyan-100 shadow-md"
                            : isMe
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md rounded-tr-xs"
                            : "bg-slate-900 border border-slate-800 text-slate-200 shadow-md rounded-tl-xs"
                        }`}>
                          {/* Live Location Card */}
                          {m.messageType === "live_location" && m.location && (
                            <LiveLocationMap location={m.location} isOwner={isMe} />
                          )}

                          {/* Poll Card */}
                          {m.messageType === "poll" && m.poll && (
                            <div className="space-y-3 min-w-[240px]">
                              <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                                <BarChart2 size={16} className="text-cyan-400" /> {m.poll.question}
                              </h4>
                              <div className="space-y-2">
                                {m.poll.options?.map((opt) => {
                                  const totalVotes = m.poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                                  const votes = opt.votes?.length || 0;
                                  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                                  const hasVoted = opt.votes?.includes(authUserId);

                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() => handleVotePoll(m._id, opt.id)}
                                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                        hasVoted
                                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                                      }`}
                                    >
                                      <span>{opt.text}</span>
                                      <span className="text-[10px] font-mono text-slate-400">{pct}% ({votes})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Expense Request Card */}
                          {m.messageType === "expense" && m.expense && (
                            <div className="space-y-2 min-w-[220px]">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="font-black text-emerald-400 text-sm">{m.expense.title}</span>
                                <span className="font-extrabold text-white">₹{m.expense.amount}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Status: <strong className={m.expense.status === "paid" ? "text-emerald-400" : "text-amber-400"}>{m.expense.status}</strong></span>
                                {m.expense.status !== "paid" && (
                                  <button
                                    onClick={() => handleMarkExpensePaid(m._id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold transition-colors cursor-pointer"
                                  >
                                    Mark as Paid
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Image Attachment */}
                          {m.messageType === "image" && m.fileUrl && (
                            <div className="space-y-2">
                              <img
                                src={m.fileUrl}
                                alt="Shared"
                                className="w-full max-h-60 object-cover rounded-xl border border-slate-800 cursor-pointer hover:opacity-90"
                                onClick={() => setLightboxImage(m.fileUrl)}
                              />
                            </div>
                          )}

                          {/* Text Message */}
                          {m.messageType === "text" && (
                            <p className="whitespace-pre-wrap">{m.message}</p>
                          )}
                        </div>

                        {/* Emoji Reactions Row */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {EMOJIS.map(emoji => {
                            const count = (m.reactions?.[emoji] || []).length;
                            const reacted = (m.reactions?.[emoji] || []).includes(authUserId);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReact(m._id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                  reacted
                                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                                }`}
                              >
                                {emoji} {count > 0 && count}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setReplyingTo(m)}
                            className="text-[10px] text-slate-500 hover:text-slate-300 font-bold ml-1 cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── FOOTER INPUT BAR ── */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
              
              {/* Replying banner */}
              {replyingTo && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <span>Replying to <strong>{replyingTo.senderName}</strong></span>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              )}

              {showVoiceRecorder ? (
                <VoiceRecorder
                  onSendVoiceNote={handleSendVoiceNote}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              ) : (
                <form onSubmit={handleSendText} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Attach file or photo"
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowVoiceRecorder(true)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Record voice note"
                  >
                    <Mic size={18} />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Message #${activeChannel} or type /ai for assistant...`}
                    className="flex-1 h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send size={15} /> Send
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* ── RIGHT DRAWER: Shared Media & Info (Optional) ── */}
          <AnimatePresence>
            {showMediaDrawer && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-slate-900 border-l border-slate-800 p-4 shrink-0 flex flex-col justify-between overflow-y-auto"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-black text-white">Shared Media</h4>
                    <button onClick={() => setShowMediaDrawer(false)} className="text-slate-400 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {["all", "photos", "documents", "locations"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setMediaCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize cursor-pointer ${
                          mediaCategory === cat ? "bg-cyan-500 text-slate-950 font-black" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 text-center py-4">No shared items found in this category.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Poll Modal ── */}
      <AnimatePresence>
        {showPollModal && (
          <>
            <div onClick={() => setShowPollModal(false)} className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" />
            <div className="fixed inset-x-4 top-[20%] z-[999] max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[28px] p-6 text-white space-y-4 shadow-2xl">
              <h3 className="text-xl font-black text-white">Create Group Poll</h3>
              <form onSubmit={handleCreatePoll} className="space-y-3">
                <input
                  type="text"
                  required
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Poll Question (e.g. Where should we eat?)..."
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-cyan-500"
                />

                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={e => {
                      const updated = [...pollOptions];
                      updated[i] = e.target.value;
                      setPollOptions(updated);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full h-10 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setPollOptions(prev => [...prev, ""])}
                  className="text-xs text-cyan-400 font-bold hover:underline"
                >
                  + Add Option
                </button>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowPollModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs">Create Poll</button>
                </div>
              </form>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Expense Request Modal ── */}
      <AnimatePresence>
        {showExpenseModal && (
          <>
            <div onClick={() => setShowExpenseModal(false)} className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" />
            <div className="fixed inset-x-4 top-[20%] z-[999] max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[28px] p-6 text-white space-y-4 shadow-2xl">
              <h3 className="text-xl font-black text-white">Split Expense Request</h3>
              <form onSubmit={handleCreateExpense} className="space-y-3">
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  placeholder="Expense Title (e.g. Dinner Bill)..."
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-cyan-500"
                />
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  placeholder="Amount in ₹ (e.g. 1200)..."
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-cyan-500"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">Send Request</button>
                </div>
              </form>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <div onClick={() => setLightboxImage(null)} className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4">
            <img src={lightboxImage} alt="Fullscreen" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          </div>
        )}
      </AnimatePresence>

    </MainLayout>
  );
};

export default TripChatPage;
