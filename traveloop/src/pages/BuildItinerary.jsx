// src/pages/BuildItinerary.jsx — Premium timeline & Calendar visualization

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import ChatTransport from "../utils/ChatTransport";
import { auth } from "../services/firebase";
import { 
  subscribeToMessages, 
  subscribeMembersSeen, 
  bootstrapTripMembers, 
  markSeen, 
  sendMessage, 
  addReaction, 
  deleteMessage,
  togglePinMessage
} from "../services/chatService";
import {
  Plus, MapPin, Clock, DollarSign, X, Trash2, Calendar, ListTodo,
  Share2, Check, Download, AlertTriangle,
  Coffee, Utensils, Camera, Hotel, Car, Ticket,
  Pencil, Copy, BookOpen, ShieldCheck, ShieldAlert, ShieldX, Plane,
  Search, ArrowRight, Mic, Square, Play, Pause, Pin
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import { signInAnonymously } from "firebase/auth";
import BottomSheet from "../components/mobile/BottomSheet";
import html2canvas from "html2canvas";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import MapPreview from "../components/trip/MapPreview";
import { calculateBudgetSummary, validateExpenseAmount } from "../utils/budgetHelper";
import logoImg from "../assets/logo.jpg";

const CATEGORY_ICONS = {
  "Food":      { icon: Utensils, color: "#F59E0B", bg: "#FEF3C7" },
  "Sightseeing":{ icon: Camera,  color: "#3B82F6", bg: "#DBEAFE" },
  "Stay":      { icon: Hotel,    color: "#8B5CF6", bg: "#EDE9FE" },
  "Transport": { icon: Car,      color: "#14B8B5", bg: "#CCFBF1" },
  "Coffee":    { icon: Coffee,   color: "#D97706", bg: "#FEF9C3" },
  "Activity":  { icon: Ticket,   color: "#EF4444", bg: "#FEE2E2" },
};

const CATEGORY_LIST = Object.keys(CATEGORY_ICONS);

const COVERS = [
  "linear-gradient(135deg,#14B8B5,#0D9488)",
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
];

const makeActivity = (day) => ({
  day,
  time: "09:00",
  title: "",
  place: "",
  budget: 0,
  category: "Activity",
  note: "",
});

const BuildItinerary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isInitialized, firebaseUser } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [days, setDays] = useState(1);
  const [activeDay, setActiveDay] = useState(1);
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = add mode, item = edit mode
  const [newItem, setNewItem] = useState(makeActivity(1));
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const [socketConnected, setSocketConnected] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [seenStates, setSeenStates] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lastActiveTimes, setLastActiveTimes] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const [isSending, setIsSending] = useState(false);

  // New V2.1 states and refs
  const [pendingSync, setPendingSync] = useState(false);
  const [longPressActive, setLongPressActive] = useState(null);
  const longPressTimeoutRef = React.useRef({});

  const [budgetError, setBudgetError] = useState("");
  const [budgetTouched, setBudgetTouched] = useState(false);

  useEffect(() => {
    if (!showAdd) {
      setBudgetError("");
      setBudgetTouched(false);
    }
  }, [showAdd]);

  const handleTouchStart = (msgId) => {
    longPressTimeoutRef.current[msgId] = setTimeout(() => {
      setLongPressActive(msgId);
    }, 600);
  };

  const handleTouchEnd = (msgId) => {
    if (longPressTimeoutRef.current[msgId]) {
      clearTimeout(longPressTimeoutRef.current[msgId]);
      delete longPressTimeoutRef.current[msgId];
    }
  };

  // Voice Recording states & refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const recordingTimerRef = React.useRef(null);

  // Message Pinning states
  const [currentPinIndex, setCurrentPinIndex] = useState(0);

  // Search index state
  const [searchIndex, setSearchIndex] = useState(0);

  // AI Assistant states
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", content: "Hi! I am your AI Travel Assistant. Ask me anything about your trip, checklist, budget, or local recommendations!" }
  ]);

  const [viewMode, setViewMode] = useState("daily"); // daily | calendar | timeline
  const [copiedLink, setCopiedLink] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [visa, setVisa] = useState(null);
  const [showVisaDetails, setShowVisaDetails] = useState(false);

  const [collabSheetOpen, setCollabSheetOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [collabTab, setCollabTab] = useState("members"); // members | logs
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  const isViewer = trip?.role === "viewer";

  const [flights, setFlights] = useState([]);
  const [flightSheetOpen, setFlightSheetOpen] = useState(false);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [savingFlight, setSavingFlight] = useState(false);
  const [refreshingFlightId, setRefreshingFlightId] = useState(null);

  const [flightForm, setFlightForm] = useState({
    flightNumber: "",
    airline: "",
    departureDate: new Date().toISOString().split("T")[0],
    manualDetails: {
      departureAirport: "",
      arrivalAirport: "",
      departureTime: "",
      arrivalTime: "",
      terminal: "",
      gate: "",
      status: "scheduled",
      delayMinutes: 0,
    }
  });
  const [editingFlight, setEditingFlight] = useState(null);
  const [showManualFields, setShowManualFields] = useState(false);

  const [notes, setNotes] = useState([]);
  const [journals, setJournals] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineFilter, setTimelineFilter] = useState({
    flight: true,
    activity: true,
    note: true,
    journal: true,
  });

  const fetchCollaborators = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${id}/collaborators`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCollaborators(data.collaborators || []);
      }
    } catch (err) {
      console.error("Failed to fetch collaborators:", err);
    }
  }, [id]);

  const fetchActivityLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${id}/activity-log`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActivityLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    }
  }, [id]);

  useEffect(() => {
    if (collabSheetOpen) {
      fetchCollaborators();
      fetchActivityLogs();
    }
  }, [collabSheetOpen, fetchCollaborators, fetchActivityLogs]);

  const formatLastActive = (date) => {
    if (!date) return "";
    const diff = new Date() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  // Connect socket and register listeners
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !id || !isInitialized || (!firebaseUser && !auth.currentUser)) return;

    // Bootstrap Firestore member documents once trip is loaded
    if (trip && user) {
      bootstrapTripMembers(id, trip, user);
    }

    ChatTransport.connect(token);
    ChatTransport.joinRoom(id);
    setSocketConnected(ChatTransport.isConnected());

    const unsubConnect = ChatTransport.onConnect(() => {
      setSocketConnected(true);
    });

    const unsubDisconnect = ChatTransport.onDisconnect(() => {
      setSocketConnected(false);
    });

    // Subscribing to messages directly via Firestore
    const unsubMessages = subscribeToMessages(id, (msgs, hasPendingWrites) => {
      setChatMessages(msgs);
      setChatLoading(false);
      setPendingSync(hasPendingWrites);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    // Subscribing to members seen status directly via Firestore
    const unsubMembersSeen = subscribeMembersSeen(id, (states) => {
      setSeenStates(states);
    });

    const unsubPresence = ChatTransport.onPresence(({ userId, status, lastActive }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === "online") {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
      if (status === "offline" && lastActive) {
        setLastActiveTimes((prev) => ({
          ...prev,
          [userId]: new Date(lastActive),
        }));
      }
    });

    const unsubRoomPresence = ChatTransport.onRoomPresence(({ onlineUserIds }) => {
      setOnlineUsers(new Set(onlineUserIds));
    });

    const unsubTyping = ChatTransport.onTyping(({ userId, userName }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
    });

    const unsubStopTyping = ChatTransport.onStopTyping(({ userId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      ChatTransport.leaveRoom(id);
      unsubConnect();
      unsubDisconnect();
      unsubMessages();
      unsubMembersSeen();
      unsubPresence();
      unsubRoomPresence();
      unsubTyping();
      unsubStopTyping();
    };
  }, [id, trip, user, isInitialized, firebaseUser, auth.currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openChat") === "true") {
      setChatOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Handle android back button for custom non-BottomSheet overlays
  useEffect(() => {
    if (!showAdd && !editingItem && !showVisaDetails) return;
    const handleHardwareBack = (e) => {
      e.preventDefault();
      if (showAdd) setShowAdd(false);
      if (editingItem) setEditingItem(null);
      if (showVisaDetails) setShowVisaDetails(false);
    };
    window.addEventListener("hardwareBack", handleHardwareBack);
    return () => {
      window.removeEventListener("hardwareBack", handleHardwareBack);
    };
  }, [showAdd, editingItem, showVisaDetails]);

  const fetchInitialMessages = useCallback(async () => {
    setChatLoading(false);
  }, []);

  useEffect(() => {
    if (chatOpen && user && isInitialized && (firebaseUser || auth.currentUser)) {
      markSeen(id, user.id || user._id);
      setTrip((prev) => (prev ? { ...prev, unreadCount: 0 } : null));
    }
  }, [chatOpen, id, user, isInitialized, firebaseUser, auth.currentUser]);

  useEffect(() => {
    if (chatOpen && isInitialized && !auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.error("[Auth] Chat open background anonymous sign in failed:", err);
      });
    }
  }, [chatOpen, isInitialized]);

  const loadMoreMessages = async () => {
    // No-op as Firestore sync handles all messages
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1280;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file exceeds the 5MB size limit.");
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setImagePreview(compressedDataUrl);
    } catch (err) {
      console.error("Image compression error:", err);
      toast.error("Failed to process image.");
    }
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !imagePreview) return;

    const payload = {
      message: chatInput,
      messageType: imagePreview ? "image" : "text",
      replyTo: replyingTo ? {
        messageId: replyingTo._id || replyingTo.id,
        senderName: replyingTo.senderName,
        preview: replyingTo.messageType === "image" ? "📷 Attached Image" : replyingTo.messageType === "voice" ? "🎵 Voice Message" : replyingTo.messageType === "location" ? "📍 Location Pin" : replyingTo.messageType === "itineraryItem" ? "🗓️ Shared Activity" : replyingTo.message
      } : null,
      fileUrl: imagePreview || "",
      fileType: imagePreview ? "image/jpeg" : "",
      fileName: imagePreview ? "chat_image.jpg" : "",
    };

    setChatInput("");
    setImagePreview(null);
    setReplyingTo(null);

    const senderId = user?.id || user?._id || "temp";
    const senderName = user ? `${user.firstName} ${user.lastName}` : "You (Offline)";
    const senderAvatar = user?.avatar || "";

    try {
      setIsSending(true);
      if (!firebaseUser && !auth.currentUser) {
        toast.error("Database connection not ready. Please try again.");
        setIsSending(false);
        return;
      }
      await sendMessage(id, {
        senderId,
        senderName,
        senderAvatar,
        message: payload.message,
        messageType: payload.messageType,
        replyTo: payload.replyTo,
        fileUrl: payload.fileUrl,
      });

      // Reward +2 XP for Chat Message
      const token = localStorage.getItem("token");
      fetch(getApiUrl("profile/reward-xp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "chat_message" })
      }).then(r => r.json()).then(data => {
        if (data.success && data.user) {
          window.dispatchEvent(new CustomEvent("userUpdated", { detail: data.user }));
        }
      }).catch(err => console.error("XP reward error:", err));

      setIsTyping(false);
      ChatTransport.emitTyping(id, false);

      // Trigger backend notification bridge
      fetch(getApiUrl(`chat/${id}/notify`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderName,
          message: payload.message,
          messageType: payload.messageType,
        }),
      }).catch((err) => console.error("Notification trigger error:", err));

    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const userId = user?.id || user?._id;
      if (userId && firebaseUser) {
        await addReaction(id, messageId, userId, emoji);
      }
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  const handleDeleteChatMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    if (!firebaseUser && !auth.currentUser) {
      toast.error("Database connection not ready.");
      return;
    }
    try {
      await deleteMessage(id, messageId);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleInputChange = (e) => {
    setChatInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      ChatTransport.emitTyping(id, true);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      ChatTransport.emitTyping(id, false);
    }, 1500);
  };

  // ── VOICE RECORDER LOGIC ──
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio recording is not supported on this connection (requires HTTPS/localhost).");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        if (audioBlob.size > 10 * 1024 * 1024) {
          toast.error("Recording exceeds the 10MB size limit.");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result;
          const senderId = user?.id || user?._id || "temp";
          const senderName = user ? `${user.firstName} ${user.lastName}` : "You";
          const senderAvatar = user?.avatar || "";

            try {
              setIsSending(true);
              if (!firebaseUser && !auth.currentUser) {
                toast.error("Database connection not ready.");
                setIsSending(false);
                return;
              }
              await sendMessage(id, {
              senderId,
              senderName,
              senderAvatar,
              message: "🎵 Voice message",
              messageType: "voice",
              fileUrl: base64Data,
            });

            const token = localStorage.getItem("token");
            fetch(getApiUrl(`chat/${id}/notify`), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                senderName,
                message: "🎵 Sent a voice message",
                messageType: "voice",
              }),
            }).catch((err) => console.error("Notification trigger error:", err));

          } catch (err) {
            console.error("Failed to send voice message:", err);
            toast.error("Failed to send voice message.");
          } finally {
            setIsSending(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Microphone access denied or not supported.");
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
        mediaRecorderRef.current.onstop = () => {
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
        };
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── GPS PIN SHARING LOGIC ──
  const shareGPSLocation = () => {
    if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
      toast.error("Geolocation is not supported or blocked on this connection (requires HTTPS/localhost).");
      return;
    }

    toast.success("Fetching GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        let address = `Coordinates: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
            headers: { "User-Agent": "TraveloopApp" }
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.display_name) {
              address = geoData.display_name;
            }
          }
        } catch (err) {
          console.warn("Reverse geocoding failed, using coordinates:", err);
        }

        const senderId = user?.id || user?._id || "temp";
        const senderName = user ? `${user.firstName} ${user.lastName}` : "You";
        const senderAvatar = user?.avatar || "";

        try {
          setIsSending(true);
          if (!firebaseUser && !auth.currentUser) {
            toast.error("Database connection not ready.");
            setIsSending(false);
            return;
          }
          await sendMessage(id, {
            senderId,
            senderName,
            senderAvatar,
            message: `📍 Location: ${address}`,
            messageType: "location",
            location: { latitude: lat, longitude: lon, address }
          });

          const token = localStorage.getItem("token");
          fetch(getApiUrl(`chat/${id}/notify`), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              senderName,
              message: `📍 Shared location: ${address}`,
              messageType: "location",
            }),
          }).catch((err) => console.error("Notification trigger error:", err));

          toast.success("Location shared! 📍");
        } catch (err) {
          console.error("Failed to share location:", err);
          toast.error("Failed to share location.");
        } finally {
          setIsSending(false);
        }
      },
      (err) => {
        console.error("GPS Fetch error:", err);
        toast.error("Unable to retrieve your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── PINNING MESSAGES LOGIC ──
  const handleTogglePin = async (messageId, pin) => {
    if (pin) {
      const pinnedCount = chatMessages.filter(m => m.pinned && !m.deletedAt).length;
      if (pinnedCount >= 5) {
        toast.error("Pin limit reached (max 5 pins). Unpin a message first.");
        return;
      }
    }
    try {
      await togglePinMessage(id, messageId, pin);
      toast.success(pin ? "Message pinned! 📌" : "Message unpinned! 🔓");
    } catch (err) {
      console.error("Failed to toggle pin:", err);
      toast.error("Failed to update pin.");
    }
  };

  // ── AI TRAVEL ASSISTANT LOGIC ──
  const handleAiAssistantQuery = async (promptText) => {
    if (!promptText.trim()) return;
    setAiMessages((prev) => [...prev, { role: "user", content: promptText }]);
    setAiPrompt("");
    setAiLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("ai/query"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tripId: id, prompt: promptText }),
      });

      const data = await res.json();
      if (data.success && data.response) {
        setAiMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setAiMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Error: ${data.message || "Failed to generate response."}` }]);
      }
    } catch (err) {
      console.error("AI assistant query error:", err);
      setAiMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Network error. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleShareActivityToChat = async (activity) => {
    const senderId = user?.id || user?._id || "temp";
    const senderName = user ? `${user.firstName} ${user.lastName}` : "You";
    const senderAvatar = user?.avatar || "";

    try {
      if (!firebaseUser) {
        toast.error("Database connection not ready.");
        return;
      }
      await sendMessage(id, {
        senderId,
        senderName,
        senderAvatar,
        message: `Check out this activity: ${activity.title || "Activity"}`,
        messageType: "itineraryItem",
        itineraryItem: {
          category: activity.category,
          time: activity.time,
          title: activity.title,
          place: activity.place,
          budget: activity.budget,
        }
      });
      toast.success("Shared activity to group chat! 💬");

      const token = localStorage.getItem("token");
      fetch(getApiUrl(`chat/${id}/notify`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderName,
          message: `Shared an activity: ${activity.title}`,
          messageType: "itineraryItem",
        }),
      }).catch((err) => console.error("Notification trigger error:", err));

    } catch (err) {
      console.error("Failed to share activity:", err);
      toast.error("Failed to share activity.");
    }
  };

  const handleInvite = async (e) => {
    if (e) e.preventDefault();
    const email = inviteEmail.trim();

    // 1. Validate Email
    if (!email) {
      toast.error("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setInviting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${id}/invite`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: email, role: inviteRole })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invitation sent successfully!");
        setInviteEmail("");
        fetchCollaborators();
        fetchActivityLogs();
        window.dispatchEvent(new CustomEvent("refreshTrips"));
      } else {
        toast.error(data.message || "Failed to send invitation");
      }
    } catch (err) {
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this collaborator?")) return;
    const originalCollaborators = [...collaborators];
    setCollaborators(prev => prev.filter(c => (c.userId?._id !== userId) && (c.userId !== userId)));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${id}/collaborators/${userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Collaborator removed successfully!");
        fetchCollaborators();
        fetchActivityLogs();
        window.dispatchEvent(new CustomEvent("refreshTrips"));
      } else {
        toast.error(data.message || "Failed to remove collaborator");
        setCollaborators(originalCollaborators);
      }
    } catch (err) {
      toast.error("Failed to remove collaborator");
      setCollaborators(originalCollaborators);
    }
  };

  const handleUpdateCollaboratorRole = async (userId, newRole) => {
    const originalCollaborators = [...collaborators];
    setCollaborators(prev =>
      prev.map(c => {
        const matches = (c.userId?._id === userId) || (c.userId === userId);
        return matches ? { ...c, role: newRole } : c;
      })
    );

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${id}/collaborators/${userId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Collaborator role updated!");
        fetchCollaborators();
        fetchActivityLogs();
        window.dispatchEvent(new CustomEvent("refreshTrips"));
      } else {
        toast.error(data.message || "Failed to update collaborator role");
        setCollaborators(originalCollaborators);
      }
    } catch (err) {
      toast.error("Failed to update collaborator role");
      setCollaborators(originalCollaborators);
    }
  };

  const formatLogTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  useEffect(() => {
    if (!trip?.destination) return;
    const fetchWeather = async () => {
      try {
        setLoadingWeather(true);
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`weather?city=${encodeURIComponent(trip.destination)}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setWeather(data);
        }
      } catch (err) {
        console.error("Failed to fetch destination weather:", err);
      } finally {
        setLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [trip?.destination]);

  // Fetch visa requirements when trip destination loads
  useEffect(() => {
    if (!trip?.destination) return;
    const fetchVisa = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`visa?destination=${encodeURIComponent(trip.destination)}&nationality=IN`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.found) setVisa(data.visa);
      } catch (err) {
        console.error("Visa fetch error:", err);
      }
    };
    fetchVisa();
  }, [trip?.destination]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTrip(prev => ({ ...prev, status: newStatus }));
        toast.success(`Trip status updated to ${newStatus}`);
        setStatusSheetOpen(false);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(getApiUrl(`trips/${id}/pdf`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to download PDF from server");
      }
      
      const blob = await response.blob();
      const filename = `${(trip?.title || "Trip").replace(/\s+/g, "_")}_Report.pdf`;

      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            const base64data = reader.result.split(',')[1];
            
            await Filesystem.writeFile({
              path: filename,
              data: base64data,
              directory: Directory.Documents,
              recursive: true
            });
            
            toast.success(`PDF saved to Documents: ${filename} ✈️`);
          } catch (fsErr) {
            console.error("Capacitor save failed:", fsErr);
            toast.error("Failed to save PDF on device.");
          }
        };
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Itinerary PDF exported successfully! ✈️");
      }
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to generate PDF.");
    } finally {
      setExporting(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("[DEBUG Frontend] Trip ID parameter received:", id);
      console.log("[DEBUG Frontend] API URL requested:", getApiUrl(`trips/${id}`));
      console.log("[DEBUG Frontend] Auth user from useAuth:", user);

      const [tripRes, itineraryRes, flightsRes] = await Promise.all([
        fetch(getApiUrl(`trips/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl(`itinerary/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl(`flights/trip/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      console.log("[DEBUG Frontend] Trip API Response status:", tripRes.status);
      const tripData = await tripRes.json();
      console.log("[DEBUG Frontend] Trip API Response payload:", tripData);

      const itinData = await itineraryRes.json();
      const flightsData = await flightsRes.json();

      if (tripData.success) {
        setTrip(tripData.trip);
        if (tripData.trip.startDate && tripData.trip.endDate) {
          const d = Math.max(1, Math.ceil(
            (new Date(tripData.trip.endDate) - new Date(tripData.trip.startDate)) / 86400000
          ));
          setDays(d);
        }
      }
      if (itinData.success) {
        setItems(itinData.itinerary || []);
      }
      if (flightsData.success) {
        setFlights(flightsData.flights || []);
      }
    } catch (err) {
      console.error("Error loading itinerary page details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleRefreshTrips = () => {
      fetchData();
      fetchCollaborators();
      fetchActivityLogs();
    };
    window.addEventListener("refreshTrips", handleRefreshTrips);
    return () => {
      window.removeEventListener("refreshTrips", handleRefreshTrips);
    };
  }, [fetchData, fetchCollaborators, fetchActivityLogs]);

  const loadTimelineResources = async () => {
    try {
      setLoadingTimeline(true);
      const token = localStorage.getItem("token");
      
      const promises = [
        fetch(getApiUrl(`flights/trip/${id}`), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(getApiUrl(`notes/${id}`), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(getApiUrl(`journal/${id}`), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(getApiUrl(`checklist/${id}`), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ];
      
      const [flightsData, notesData, journalData, checklistData] = await Promise.all(promises);
      
      if (flightsData.success) setFlights(flightsData.flights || []);
      if (notesData.success) setNotes(notesData.notes || []);
      if (journalData.success) setJournals(journalData.entries || []);
      if (checklistData.success) {
        const itemsList = [];
        if (checklistData.categories) {
          checklistData.categories.forEach(cat => {
            if (cat.items) {
              cat.items.forEach(item => {
                itemsList.push({ ...item, categoryName: cat.name });
              });
            }
          });
        }
        setChecklistItems(itemsList);
      }
    } catch (err) {
      console.error("Failed to load timeline resources:", err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (viewMode === "timeline") {
      loadTimelineResources();
    }
  }, [viewMode]);

  const handleSaveFlight = async (e) => {
    if (e) e.preventDefault();
    if (!flightForm.flightNumber.trim()) { toast.error("Flight number is required"); return; }
    if (!flightForm.airline.trim()) { toast.error("Airline is required"); return; }
    
    try {
      setSavingFlight(true);
      const token = localStorage.getItem("token");
      
      let res, data;
      if (editingFlight) {
        res = await fetch(getApiUrl(`flights/${editingFlight._id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            flightNumber: flightForm.flightNumber,
            airline: flightForm.airline,
            departureAirport: flightForm.manualDetails.departureAirport,
            arrivalAirport: flightForm.manualDetails.arrivalAirport,
            departureTime: flightForm.manualDetails.departureTime,
            arrivalTime: flightForm.manualDetails.arrivalTime,
            terminal: flightForm.manualDetails.terminal,
            gate: flightForm.manualDetails.gate,
            status: flightForm.manualDetails.status,
            delayMinutes: flightForm.manualDetails.delayMinutes,
          }),
        });
      } else {
        res = await fetch(getApiUrl("flights/create"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            tripId: id,
            flightNumber: flightForm.flightNumber,
            airline: flightForm.airline,
            departureDate: flightForm.departureDate,
            manualDetails: flightForm.manualDetails,
          }),
        });
      }
      
      data = await res.json();
      if (data.success) {
        toast.success(editingFlight ? "Flight details updated!" : "Flight added successfully!");
        setEditingFlight(null);
        setShowManualFields(false);
        const flightsRes = await fetch(getApiUrl(`flights/trip/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const flightsData = await flightsRes.json();
        if (flightsData.success) {
          setFlights(flightsData.flights || []);
        }
        if (viewMode === "timeline") {
          loadTimelineResources();
        }
      } else {
        toast.error(data.message || "Failed to save flight");
      }
    } catch (err) {
      toast.error("Failed to save flight details");
    } finally {
      setSavingFlight(false);
    }
  };

  const handleDeleteFlight = async (flightId) => {
    if (!window.confirm("Are you sure you want to delete this flight?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`flights/${flightId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Flight deleted successfully!");
        setFlights(prev => prev.filter(f => f._id !== flightId));
        if (viewMode === "timeline") {
          loadTimelineResources();
        }
      } else {
        toast.error(data.message || "Failed to delete flight");
      }
    } catch (err) {
      toast.error("Failed to delete flight");
    }
  };

  const handleRefreshFlight = async (flightId) => {
    try {
      setRefreshingFlightId(flightId);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`flights/${flightId}/refresh`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Flight status updated!");
        setFlights(prev => prev.map(f => f._id === flightId ? data.flight : f));
        if (viewMode === "timeline") {
          loadTimelineResources();
        }
      } else {
        toast.error(data.message || "Failed to refresh flight status");
      }
    } catch (err) {
      toast.error("Failed to refresh flight status");
    } finally {
      setRefreshingFlightId(null);
    }
  };

  const getTimelineEvents = () => {
    let events = [];
    const tripStart = trip?.startDate ? new Date(trip.startDate) : new Date();

    flights.forEach((f) => {
      const depDate = f.departureTime ? new Date(f.departureTime) : new Date(tripStart);
      events.push({
        id: `flight-${f._id}`,
        type: "flight",
        title: `${f.airline} ${f.flightNumber}`,
        time: f.departureTime ? new Date(f.departureTime).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true }) : "12:00 PM",
        date: depDate,
        day: Math.max(1, Math.ceil((depDate - tripStart) / 86400000) + 1),
        details: f,
      });
    });

    items.forEach((item) => {
      const itemDate = new Date(tripStart.getTime() + (item.day - 1) * 86400000);
      let [hour, minute] = [9, 0];
      const match = item.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hour = parseInt(match[1]);
        minute = parseInt(match[2]);
        const amp = match[3];
        if (amp && amp.toUpperCase() === "PM" && hour < 12) hour += 12;
        if (amp && amp.toUpperCase() === "AM" && hour === 12) hour = 0;
      }
      itemDate.setHours(hour, minute, 0, 0);

      events.push({
        id: `activity-${item._id}`,
        type: "activity",
        title: item.title,
        time: item.time,
        date: itemDate,
        day: item.day,
        details: item,
      });
    });

    notes.forEach((note) => {
      const noteDay = note.day || 1;
      const noteDate = new Date(tripStart.getTime() + (noteDay - 1) * 86400000);
      noteDate.setHours(10, 0, 0, 0);

      events.push({
        id: `note-${note._id}`,
        type: "note",
        title: note.title,
        time: "10:00 AM",
        date: noteDate,
        day: noteDay,
        details: note,
      });
    });

    journals.forEach((entry) => {
      const entryDay = entry.day || 1;
      const entryDate = new Date(tripStart.getTime() + (entryDay - 1) * 86400000);
      entryDate.setHours(21, 0, 0, 0);

      events.push({
        id: `journal-${entry._id}`,
        type: "journal",
        title: entry.title || `Day ${entryDay} Memories`,
        time: "09:00 PM",
        date: entryDate,
        day: entryDay,
        details: entry,
      });
    });

    if (checklistItems && checklistItems.length > 0) {
      const checklistDate = new Date(tripStart);
      checklistDate.setHours(8, 0, 0, 0);
      events.push({
        id: "checklist-summary",
        type: "checklist",
        title: "Packing Checklist",
        time: "08:00 AM",
        date: checklistDate,
        day: 1,
        details: checklistItems,
      });
    }

    events.sort((a, b) => a.date - b.date);

    if (timelineSearch.trim()) {
      const query = timelineSearch.toLowerCase();
      events = events.filter((e) => {
        const text = `${e.title} ${e.time} ${e.details?.content || ""} ${e.details?.note || ""} ${e.details?.place || ""} ${e.details?.airline || ""} ${e.details?.flightNumber || ""}`.toLowerCase();
        return text.includes(query);
      });
    }

    events = events.filter((e) => timelineFilter[e.type]);

    return events;
  };

  const renderFlightForm = () => {
    return (
      <div className="space-y-4">
        {/* Flight Number */}
        <div>
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Flight Number *</p>
          <input
            value={flightForm.flightNumber}
            onChange={e => setFlightForm(f => ({ ...f, flightNumber: e.target.value }))}
            placeholder="e.g. AI302, EK543, 6E621"
            className="w-full px-4 py-3 rounded-[14px] border border-slate-200 dark:border-slate-700 text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        {/* Airline */}
        <div>
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Airline *</p>
          <input
            value={flightForm.airline}
            onChange={e => setFlightForm(f => ({ ...f, airline: e.target.value }))}
            placeholder="e.g. Air India, Emirates, IndiGo"
            className="w-full px-4 py-3 rounded-[14px] border border-slate-200 dark:border-slate-700 text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        {/* Departure Date */}
        {!editingFlight && (
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Departure Date *</p>
            <input
              type="date"
              value={flightForm.departureDate}
              onChange={e => setFlightForm(f => ({ ...f, departureDate: e.target.value }))}
              className="w-full px-4 py-3 rounded-[14px] border border-slate-200 dark:border-slate-700 text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none focus:border-teal-400 transition-colors"
            />
          </div>
        )}

        {/* Verify API Button / Manual Toggle */}
        {!editingFlight && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!flightForm.flightNumber.trim()) { toast.error("Flight number is required to fetch status"); return; }
                try {
                  toast.success("Fetching live status...");
                  const token = localStorage.getItem("token");
                  const dateStr = flightForm.departureDate;
                  const res = await fetch(getApiUrl(`flights/create`), {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      tripId: id,
                      flightNumber: flightForm.flightNumber,
                      airline: flightForm.airline || "Unknown",
                      departureDate: dateStr,
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success("Live flight details fetched and saved!");
                    setFlights(prev => [...prev, data.flight].sort((a,b) => new Date(a.departureTime) - new Date(b.departureTime)));
                    setFlightSheetOpen(false);
                    if (viewMode === "timeline") loadTimelineResources();
                  } else {
                    toast.error("Flight details not found. Please fill manual fields.");
                    setShowManualFields(true);
                  }
                } catch (e) {
                  toast.error("API failed. Opening manual details form.");
                  setShowManualFields(true);
                }
              }}
              className="flex-1 py-3 rounded-full text-white font-bold text-xs bg-sky-500 shadow-sm active:scale-95 transition-all"
            >
              Verify & Fetch Live
            </button>
            <button
              type="button"
              onClick={() => setShowManualFields(true)}
              className="px-4 py-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-xs active:scale-95 transition-all"
            >
              Manual Details
            </button>
          </div>
        )}

        {/* Manual details sections */}
        {(showManualFields || editingFlight) && (
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Flight Coordinates & Times</h5>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Departure Airport</p>
                <input
                  value={flightForm.manualDetails.departureAirport}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, departureAirport: e.target.value.toUpperCase() } }))}
                  placeholder="e.g. DEL"
                  maxLength={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Arrival Airport</p>
                <input
                  value={flightForm.manualDetails.arrivalAirport}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, arrivalAirport: e.target.value.toUpperCase() } }))}
                  placeholder="e.g. NRT"
                  maxLength={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Departure Time</p>
                <input
                  type="datetime-local"
                  value={flightForm.manualDetails.departureTime}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, departureTime: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Arrival Time</p>
                <input
                  type="datetime-local"
                  value={flightForm.manualDetails.arrivalTime}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, arrivalTime: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Terminal</p>
                <input
                  value={flightForm.manualDetails.terminal}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, terminal: e.target.value } }))}
                  placeholder="e.g. 3"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gate</p>
                <input
                  value={flightForm.manualDetails.gate}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, gate: e.target.value } }))}
                  placeholder="e.g. G12"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Flight Status</p>
                <select
                  value={flightForm.manualDetails.status}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, status: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="boarding">Boarding</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="landed">Landed</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Delay (minutes)</p>
                <input
                  type="number"
                  value={flightForm.manualDetails.delayMinutes}
                  onChange={e => setFlightForm(f => ({ ...f, manualDetails: { ...f.manualDetails, delayMinutes: parseInt(e.target.value) || 0 } }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSaveFlight}
          disabled={savingFlight}
          className="w-full py-4 rounded-[18px] text-white font-bold text-sm shadow-brand active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
        >
          {savingFlight ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
          ) : (
            editingFlight ? "Update Flight" : "Save Flight Details"
          )}
        </button>
      </div>
    );
  };

  const renderUnifiedTimeline = () => {
    const events = getTimelineEvents();

    return (
      <div className="space-y-4">
        {/* Search bar & Filters */}
        <div className="space-y-3">
          {/* Search Input */}
          <input
            value={timelineSearch}
            onChange={e => setTimelineSearch(e.target.value)}
            placeholder="🔎 Search timeline entries..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-white outline-none focus:border-teal-400 transition-colors"
          />

          {/* Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            {Object.keys(timelineFilter).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setTimelineFilter(f => ({ ...f, [type]: !f[type] }))}
                className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider transition-all ${
                  timelineFilter[type]
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                {type === "flight" ? "✈️ Flights" :
                 type === "activity" ? "📍 Activities" :
                 type === "note" ? "📋 Notes" :
                 "📝 Journal"}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Events List */}
        {loadingTimeline ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-[18px]" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-semibold border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10">
            <span className="text-4xl block mb-2">🗓️</span>
            No timeline matches found.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6 py-2">
            {events.map((event, idx) => {
              let iconEmoji = "📍";
              let cardBg = "bg-white dark:bg-slate-900";
              let titleColor = "text-slate-800 dark:text-white";
              
              if (event.type === "flight") {
                iconEmoji = "✈️";
                cardBg = "bg-sky-50/30 dark:bg-sky-950/10 border-sky-100 dark:border-sky-900/20";
              } else if (event.type === "note") {
                iconEmoji = "📋";
                cardBg = "bg-amber-50/20 dark:bg-amber-950/5 border-amber-100/50 dark:border-amber-900/10";
              } else if (event.type === "journal") {
                iconEmoji = "📝";
                cardBg = "bg-teal-50/20 dark:bg-teal-950/5 border-teal-100/50 dark:border-teal-900/10";
              } else if (event.type === "checklist") {
                iconEmoji = "🧳";
                cardBg = "bg-violet-50/20 dark:bg-violet-950/5 border-violet-100/50 dark:border-violet-900/10";
              }

              return (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-teal-500 flex items-center justify-center text-xs shadow-sm z-10">
                    {iconEmoji}
                  </div>

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Day {event.day} · {event.time}</span>
                    <span className="text-[9px] font-extrabold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">{event.type}</span>
                  </div>

                  <div className={`premium-card p-4 border ${cardBg}`}>
                    <h5 className={`text-sm font-extrabold ${titleColor}`}>{event.title}</h5>
                    
                    {event.type === "flight" && (
                      <div className="mt-2 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between font-bold">
                          <span>Route: {event.details.departureAirport} ➔ {event.details.arrivalAirport}</span>
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                            event.details.status === "scheduled" ? "bg-emerald-50 text-emerald-600" :
                            event.details.status === "boarding" ? "bg-blue-50 text-blue-600" :
                            event.details.status === "delayed" ? "bg-amber-50 text-amber-600" :
                            event.details.status === "cancelled" ? "bg-red-50 text-red-600" :
                            "bg-teal-50 text-teal-600"
                          }`}>{event.details.status}</span>
                        </div>
                        {event.details.terminal && <p>Terminal: {event.details.terminal} {event.details.gate ? `· Gate ${event.details.gate}` : ""}</p>}
                        {event.details.delayMinutes > 0 && <p className="text-amber-500 font-bold">Delay: {event.details.delayMinutes} mins</p>}
                      </div>
                    )}

                    {event.type === "activity" && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1 font-medium">
                        {event.details.place && <p>📍 {event.details.place}</p>}
                        {event.details.note && <p className="italic text-slate-400 mt-1">Note: {event.details.note}</p>}
                      </div>
                    )}

                    {event.type === "note" && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap font-medium">{event.details.content}</p>
                    )}

                    {event.type === "journal" && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                        <p className="line-clamp-3 whitespace-pre-wrap font-medium">{event.details.content}</p>
                        {event.details.highlights?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.details.highlights.map((h, i) => (
                              <span key={i} className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">⭐ {h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {event.type === "checklist" && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-bold text-slate-500">Items to pack:</p>
                        <p>{event.details.filter(item => !item.checked).slice(0, 3).map(item => item.name).join(", ")}
                           {event.details.length > 3 ? ` and ${event.details.length - 3} more items` : ""}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const dayItems = items.filter(i => i.day === activeDay);
  const totalBudget = items.reduce((s, i) => s + (i.budget || 0), 0);
  const otherItemsExpenses = items.reduce((s, i) => {
    if (editingItem && i._id === editingItem._id) return s;
    return s + (i.budget || 0);
  }, 0);

  const addItem = async () => {
    if (!newItem.title) return;
    const limitBudget = trip?.budget || 0;
    const valNum = Number(newItem.budget) || 0;
    if (valNum < 0) {
      setBudgetError("Expense amount cannot be negative.");
      return;
    }
    if (valNum + otherItemsExpenses > limitBudget) {
      setBudgetError("Expense exceeds available trip budget.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("itinerary/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip: id,
          day: activeDay,
          time: newItem.time,
          title: newItem.title,
          place: newItem.place,
          budget: newItem.budget,
          category: newItem.category,
          note: newItem.note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setItems(prev => [...prev, data.itinerary]);
        setNewItem(makeActivity(activeDay));
        setShowAdd(false);
        toast.success("Activity added successfully!");
      } else {
        toast.error(data.message || "Failed to add activity");
      }
    } catch (err) {
      toast.error("Failed to add activity");
    }
  };

  const updateItem = async () => {
    if (!newItem.title || !editingItem) return;
    const limitBudget = trip?.budget || 0;
    const valNum = Number(newItem.budget) || 0;
    if (valNum < 0) {
      setBudgetError("Expense amount cannot be negative.");
      return;
    }
    if (valNum + otherItemsExpenses > limitBudget) {
      setBudgetError("Expense exceeds available trip budget.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`itinerary/${editingItem._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day: newItem.day,
          time: newItem.time,
          title: newItem.title,
          place: newItem.place,
          budget: newItem.budget,
          category: newItem.category,
          note: newItem.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(i => i._id === editingItem._id ? data.itinerary : i));
        setShowAdd(false);
        setEditingItem(null);
        setNewItem(makeActivity(activeDay));
        toast.success("Activity updated!");
      } else {
        toast.error(data.message || "Failed to update activity");
      }
    } catch (err) {
      toast.error("Failed to update activity");
    }
  };

  const duplicateItem = async (item) => {
    const totalWithDuplicated = totalBudget + (item.budget || 0);
    if (trip?.budget && totalWithDuplicated > trip.budget) {
      toast.error("Duplicating this activity exceeds the remaining available budget.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("itinerary/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip: id,
          day: item.day,
          time: item.time,
          title: `${item.title} (copy)`,
          place: item.place,
          budget: item.budget,
          category: item.category,
          note: item.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => [...prev, data.itinerary]);
        toast.success("Activity duplicated!");
      } else {
        toast.error(data.message || "Failed to duplicate activity");
      }
    } catch (err) {
      toast.error("Failed to duplicate activity");
    }
  };

  const openEditSheet = (item) => {
    setEditingItem(item);
    setNewItem({
      day: item.day,
      time: item.time || "09:00",
      title: item.title || "",
      place: item.place || "",
      budget: item.budget || 0,
      category: item.category || "Activity",
      note: item.note || "",
    });
    setBudgetError("");
    setBudgetTouched(false);
    setShowAdd(true);
  };

  const closeSheet = () => {
    setShowAdd(false);
    setEditingItem(null);
    setNewItem(makeActivity(activeDay));
    setBudgetError("");
    setBudgetTouched(false);
  };

  const removeItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`itinerary/${itemId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.filter(i => i._id !== itemId));
        toast.success("Activity removed");
      }
    } catch (err) {
      toast.error("Failed to remove activity");
    }
  };

  const copyPreviousDay = async () => {
    if (activeDay <= 1) return;
    const prevDayItems = items.filter(i => i.day === activeDay - 1);
    if (prevDayItems.length === 0) {
      toast.error(`Day ${activeDay - 1} has no activities to copy.`);
      return;
    }
    
    const copiedBudgetSum = prevDayItems.reduce((sum, item) => sum + (item.budget || 0), 0);
    const totalWithCopied = totalBudget + copiedBudgetSum;
    if (trip?.budget && totalWithCopied > trip.budget) {
      toast.error("Copying these activities exceeds the remaining available budget.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const promises = prevDayItems.map(item =>
        fetch(getApiUrl("itinerary/create"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            trip: id,
            day: activeDay,
            time: item.time,
            title: item.title,
            place: item.place,
            budget: item.budget,
            category: item.category,
            note: item.note,
          }),
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      const newSavedItems = results.filter(r => r.success).map(r => r.itinerary);
      if (newSavedItems.length > 0) {
        setItems(prev => [...prev, ...newSavedItems]);
        toast.success(`Successfully copied ${newSavedItems.length} activities from Day ${activeDay - 1}!`);
      } else {
        toast.error("Failed to copy activities.");
      }
    } catch (err) {
      console.error("Failed to copy previous day's activities:", err);
      toast.error("Failed to copy previous day's activities");
    }
  };

  const handleShareTrip = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${id}/share`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic: true }),
      });

      const data = await res.json();
      if (data.success) {
        const publicUrl = `http://localhost:3000/shared/${data.trip.shareToken}`;
        setShareLink(publicUrl);
        navigator.clipboard.writeText(publicUrl);
        setCopiedLink(true);
        setShowShareModal(true);
        toast.success("Public link copied to clipboard!");
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err) {
      toast.error("Failed to share trip");
    }
  };

  const getDayDateString = (dayNum) => {
    if (!trip?.startDate) return "";
    const start = new Date(trip.startDate);
    start.setDate(start.getDate() + (dayNum - 1));
    return start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="px-4 pt-4">
          <div className="h-48 rounded-[24px] skeleton mb-4" />
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(i => <div key={i} className="h-10 w-20 skeleton rounded-full" />)}
          </div>
          {[1, 2].map(i => <div key={i} className="h-24 skeleton rounded-[20px] mb-3" />)}
        </div>
      </MainLayout>
    );
  }

  if (!trip) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl">😕</span>
          <p className="text-xl font-bold text-slate-700">Trip Not Found</p>
          <button onClick={() => navigate("/my-trips")} className="px-6 py-3 rounded-full text-white font-semibold" style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}>
            Back to Trips
          </button>
        </div>
      </MainLayout>
    );
  }

  const STATUS_CONFIG = {
    planning:  { label: "Planning",  bg: "bg-amber-500",   text: "text-white" },
    upcoming:  { label: "Upcoming",  bg: "bg-blue-500",   text: "text-white" },
    ongoing:   { label: "Ongoing",   bg: "bg-emerald-500", text: "text-white" },
    completed: { label: "Completed", bg: "bg-slate-400",   text: "text-white" },
  };

  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planning;

  return (
    <MainLayout>
      {/* ── HERO COVER ── */}
      <div
        className="relative h-44 mx-4 mt-4 rounded-[24px] overflow-hidden"
        style={{ background: COVERS[0] }}
      >
        {/* Fallback layer in background */}
        <div className="absolute inset-0 flex items-center justify-center text-7xl">✈️</div>

        {/* Custom Image layer on top */}
        {trip.image && !imageError && (
          <img
            src={trip.image}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={() => setImageError(true)}
          />
        )}
        <div
          className="absolute inset-0 z-20"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent 60%)" }}
        />
        
        {/* Status Badge top left */}
        <button
          onClick={() => !isViewer && setStatusSheetOpen(true)}
          className={`absolute top-4 left-4 z-30 px-3 py-1.5 rounded-full text-[10px] font-extrabold shadow-md transition-all ${isViewer ? "cursor-default opacity-90" : "active:scale-95 cursor-pointer"} ${status.bg} ${status.text}`}
        >
          {status.label}
        </button>

        {/* PDF Export Button */}
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="absolute top-4 right-14 z-30 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50"
          title="Export Itinerary PDF"
        >
          <Download size={16} className="text-slate-600" />
        </button>

        {/* Share Button top right */}
        <button
          onClick={handleShareTrip}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} className="text-slate-600" />}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
          <h2 className="text-white font-extrabold text-xl leading-tight truncate max-w-[85%]">{trip.title}</h2>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <MapPin size={12} className="text-white/70 flex-shrink-0" />
              <span className="text-white/70 text-xs truncate max-w-[200px]">{trip.destination}</span>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 text-white select-none">
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-[9px] text-white/80 font-bold uppercase tracking-wider">Budget:</span>
                <span className="text-xs font-black">₹{(trip.budget || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-[9px] text-white/80 font-bold uppercase tracking-wider">Planned:</span>
                <span className="text-xs font-black">₹{totalBudget.toLocaleString()}</span>
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full backdrop-blur-sm ${trip.budget - totalBudget < 0 ? "bg-red-500/50 text-red-100 animate-pulse border border-red-500/30" : "bg-white/20"}`}>
                <span className="text-[9px] text-white/80 font-bold uppercase tracking-wider">Remaining:</span>
                <span className="text-xs font-black">₹{(trip.budget - totalBudget).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESTINATION WEATHER CARD ── */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 premium-card p-4 bg-white border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              🌤️ Destination Weather
            </h3>
            <span className="text-[9px] font-bold text-slate-400">Open-Meteo Live</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-2xl">
                {(() => {
                  const lbl = weather.current.label;
                  if (lbl.includes("Sunny")) return "☀️";
                  if (lbl.includes("Cloudy") || lbl.includes("Overcast")) return "☁️";
                  if (lbl.includes("Rain") || lbl.includes("Drizzle") || lbl.includes("Showers")) return "🌧️";
                  if (lbl.includes("Storm")) return "⛈️";
                  if (lbl.includes("Snow")) return "❄️";
                  return "💨";
                })()}
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-800">{weather.current.temp}</span>
                <span className="text-slate-400 text-[10px] font-bold block mt-0.5">
                  {weather.current.label} · {weather.current.windspeed} wind
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {weather.city}
              </span>
            </div>
          </div>

          {/* Warnings */}
          {weather.warning && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2 text-amber-800">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] font-bold leading-normal">{weather.warning}</p>
            </div>
          )}

          {/* Forecast divider */}
          <div className="my-3 border-t border-slate-50" />

          {/* 3-Day Forecast */}
          <div className="grid grid-cols-3 gap-2">
            {weather.forecast.map((f, idx) => (
              <div key={idx} className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">{f.day}</span>
                <span className="text-lg my-1">
                  {(() => {
                    if (f.label.includes("Sunny")) return "☀️";
                    if (f.label.includes("Cloudy") || f.label.includes("Overcast")) return "☁️";
                    if (f.label.includes("Rain") || f.label.includes("Drizzle") || f.label.includes("Showers")) return "🌧️";
                    if (f.label.includes("Storm")) return "⛈️";
                    if (f.label.includes("Snow")) return "❄️";
                    return "💨";
                  })()}
                </span>
                <span className="text-xs font-extrabold text-slate-700">{f.tempMax}</span>
                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{f.tempMin} min</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── MAP PREVIEW CARD ── */}
      {trip && trip.latitude !== undefined && trip.longitude !== undefined && trip.latitude !== null && trip.longitude !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 premium-card p-4 bg-white border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              🗺️ Destination Map
            </h3>
            <span className="text-[9px] font-bold text-slate-400">Interactive Preview</span>
          </div>

          <div className="mb-3 text-xs text-slate-600 font-semibold leading-relaxed">
            <p className="font-bold text-slate-800">{trip.destinationName || trip.destination}</p>
            {trip.formattedAddress && <p className="text-slate-500 font-medium mt-0.5">{trip.formattedAddress}</p>}
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Coordinates: {trip.latitude?.toFixed(5)}°, {trip.longitude?.toFixed(5)}°
            </p>
          </div>

          <MapPreview
            latitude={trip.latitude}
            longitude={trip.longitude}
            destinationName={trip.destinationName || trip.destination}
          />
        </motion.div>
      )}

      {/* ── VISA REQUIREMENTS CARD ── */}
      {visa && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 premium-card p-4 bg-white border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              {visa.advisory === "Safe" ? <ShieldCheck size={12} className="text-emerald-500" /> : <ShieldAlert size={12} className="text-amber-500" />}
              Visa Requirements
            </h3>
            <button
              onClick={() => setShowVisaDetails(v => !v)}
              className="text-[10px] font-bold text-teal-600 underline"
            >
              {showVisaDetails ? "Show Less" : "Show More"}
            </button>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">{visa.flag || "🌍"}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                  style={{
                    background: visa.visaType.includes("Free") ? "#D1FAE5" : visa.visaType.includes("Arrival") ? "#FEF3C7" : "#FEE2E2",
                    color:      visa.visaType.includes("Free") ? "#065F46" : visa.visaType.includes("Arrival") ? "#92400E" : "#991B1B",
                  }}
                >
                  {visa.visaType}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: visa.advisoryColor + "20", color: visa.advisoryColor }}
                >
                  {visa.advisory}
                </span>
              </div>
              {visa.note && (
                <p className="text-[11px] text-slate-600 leading-relaxed">{visa.note}</p>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showVisaDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
                  {visa.passportValidity && (
                    <p className="text-[11px] text-slate-600"><span className="font-bold text-slate-700">Passport: </span>{visa.passportValidity}</p>
                  )}
                  {visa.entryRestrictions && (
                    <p className="text-[11px] text-slate-600"><span className="font-bold text-slate-700">Note: </span>{visa.entryRestrictions}</p>
                  )}
                  {visa.requirements?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 mb-1.5">Required Documents:</p>
                      <div className="space-y-1">
                        {visa.requirements.map((r, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                            <p className="text-[11px] text-slate-600">{r}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── JOURNAL QUICK LINK ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 premium-card p-4 bg-white border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
        onClick={() => navigate(`/travel-journal/${id}`)}
      >
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: "rgba(20,184,181,0.1)" }}>
          <BookOpen size={18} className="text-teal-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">Travel Journal</p>
          <p className="text-[11px] text-slate-400">Document your daily memories & highlights</p>
        </div>
        <span className="text-slate-400 text-xs">›</span>
      </motion.div>

      {/* ── COLLABORATORS QUICK LINK ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 premium-card p-4 bg-white border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
        onClick={() => setCollabSheetOpen(true)}
      >
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
          <Share2 size={18} className="text-indigo-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">Trip Collaborators</p>
          <p className="text-[11px] text-slate-400">Invite friends & view activity log</p>
        </div>
        <span className="text-slate-400 text-xs">›</span>
      </motion.div>

      {/* ── FLIGHTS QUICK LINK ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 premium-card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
        onClick={() => setFlightSheetOpen(true)}
      >
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: "rgba(14,165,233,0.1)" }}>
          <Plane size={18} className="text-sky-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-white">Flights</p>
          <p className="text-[11px] text-slate-400">Track delay status, terminal & gate details</p>
        </div>
        <span className="text-slate-400 text-xs">›</span>
      </motion.div>

      {/* ── CHAT QUICK LINK ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 premium-card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
        onClick={() => setChatOpen(true)}
      >
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: "rgba(244,63,94,0.1)" }}>
          <span className="text-lg">💬</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Trip Chat</p>
            {trip?.unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white leading-none">
                {trip.unreadCount}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Discuss itinerary, budget, and coordinates live</p>
        </div>
        <span className="text-slate-400 text-xs">›</span>
      </motion.div>

      {/* ── AI TRAVEL ASSISTANT QUICK LINK ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 premium-card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
        onClick={() => setAiSheetOpen(true)}
      >
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
          <span className="text-lg">🤖</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-white">AI Travel Assistant</p>
          <p className="text-[11px] text-slate-400">Ask emergency info, local food, or day plans</p>
        </div>
        <span className="text-slate-400 text-xs">›</span>
      </motion.div>

      <div className="px-4">
        {/* View switcher & stats */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Itinerary Schedule
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("daily")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "daily" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
              }`}
            >
              <ListTodo size={13} />
              Daily
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "calendar" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
              }`}
            >
              <Calendar size={13} />
              Calendar
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "timeline" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
              }`}
            >
              <Clock size={13} />
              Timeline
            </button>
          </div>
        </div>

        {/* ── CALENDAR VIEW ── */}
        {viewMode === "calendar" ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {Array.from({ length: days }, (_, i) => i + 1).map(d => {
              const count = items.filter(item => item.day === d).length;
              const isSelected = activeDay === d;
              return (
                <motion.div
                  key={d}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setActiveDay(d); setViewMode("daily"); }}
                  className={`p-4 rounded-[20px] border cursor-pointer flex flex-col justify-between h-28 relative ${
                    isSelected ? "border-teal-500 bg-teal-50/20" : "border-slate-200 bg-white"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Day {d}</span>
                    <span className="text-xs font-bold text-slate-700 mt-1 block">{getDayDateString(d)}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full self-start ${
                    count > 0 ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"
                  }`}>
                    {count} {count === 1 ? "activity" : "activities"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : viewMode === "timeline" ? (
          /* ── CHRONOLOGICAL TRAVEL TIMELINE VIEW ── */
          <div className="mt-4">
            {renderUnifiedTimeline()}
          </div>
        ) : (
          /* ── DAILY ITINERARY VIEW ── */
          <>
            {/* Day tabs row */}
            <div className="chip-row py-4 -mx-4 px-4">
              {Array.from({ length: days }, (_, i) => i + 1).map(d => (
                <motion.button
                  key={d}
                  whileTap={{ scale: 0.90 }}
                  onClick={() => setActiveDay(d)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                    activeDay === d
                      ? "text-white shadow-brand"
                      : "bg-white text-slate-500 border border-slate-200"
                  }`}
                  style={activeDay === d ? { background: "linear-gradient(135deg,#14B8B5,#0D9488)" } : {}}
                >
                  Day {d}
                  {items.filter(i => i.day === d).length > 0 && (
                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeDay === d ? "bg-white/25 text-white" : "bg-teal-50 text-teal-600"
                    }`}>
                      {items.filter(i => i.day === d).length}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Activities list */}
            {dayItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 dark:bg-slate-800/20 dark:border-slate-800"
              >
                <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-3xl mb-2">
                  📍
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No activities scheduled for Day {activeDay}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mb-4">
                  {!isViewer ? "Add custom activities, duplicate your itinerary from the previous day, or get Gemini AI suggestions!" : "View the trip itinerary planned by your coordinators."}
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-[260px]">
                  {!isViewer ? (
                    <>
                      <button
                        onClick={() => { setEditingItem(null); setNewItem(makeActivity(activeDay)); setShowAdd(true); }}
                        className="w-full py-3 rounded-full text-white font-bold text-xs shadow-brand bg-teal-500 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                      >
                        <Plus size={14} /> Add Activity
                      </button>

                      {activeDay > 1 && items.some(i => i.day === activeDay - 1) && (
                        <button
                          onClick={copyPreviousDay}
                          className="w-full py-3 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Copy size={13} /> Copy Day {activeDay - 1} Itinerary
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/activities/${id}`)}
                        className="w-full py-3 rounded-full bg-violet-500 hover:bg-violet-600 active:scale-95 transition-all text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-violet-500/20"
                      >
                        ✨ Generate AI Suggestions
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                      As a viewer, you cannot modify the itinerary.
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100" />

                <AnimatePresence>
                  {dayItems.map((item, idx) => {
                    const cat = CATEGORY_ICONS[item.category] || CATEGORY_ICONS["Activity"];
                    const CatIcon = cat.icon;
                    return (
                      <motion.div
                        key={item._id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex gap-3 mb-4 relative"
                      >
                        {/* Timeline Circle Pin */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm border border-white"
                          style={{ background: cat.bg }}
                        >
                          <CatIcon size={16} style={{ color: cat.color }} />
                        </div>

                        {/* Event Card — tap to edit */}
                        <div
                          className={`flex-1 premium-card p-4 ${isViewer ? "cursor-default" : "cursor-pointer"}`}
                          onClick={() => !isViewer && openEditSheet(item)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
                                  {item.category}
                                </span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Clock size={10} /> {item.time}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-800 activity-title">{item.title || "Untitled"}</h4>
                              {item.place && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin size={11} className="text-slate-400" />
                                  <span className="text-xs text-slate-400 truncate">{item.place}</span>
                                </div>
                              )}
                              {item.budget > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <DollarSign size={11} className="text-teal-500" />
                                  <span className="text-xs font-semibold text-teal-600">₹{item.budget.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => handleShareActivityToChat(item)}
                                className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center animate-pulse"
                                title="Share to chat"
                              >
                                <Share2 size={12} className="text-emerald-500" />
                              </motion.button>
                              {!isViewer && (
                                <>
                                  <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => duplicateItem(item)}
                                    className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center"
                                    title="Duplicate activity"
                                  >
                                    <Copy size={12} className="text-blue-400" />
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => openEditSheet(item)}
                                    className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center"
                                    title="Edit activity"
                                  >
                                    <Pencil size={12} className="text-teal-500" />
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => removeItem(item._id)}
                                    className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center"
                                    title="Delete activity"
                                  >
                                    <Trash2 size={13} className="text-red-400" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Add Activity Button */}
            {!isViewer && (
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={() => { setEditingItem(null); setNewItem(makeActivity(activeDay)); setShowAdd(true); }}
                className="fixed z-40 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold shadow-brand"
                style={{
                  background: "linear-gradient(135deg, #14B8B5, #0D9488)",
                  bottom: "calc(var(--bottom-nav-height, 80px) + max(env(safe-area-inset-bottom), 12px) + 16px)",
                  right: "16px",
                }}
              >
                <Plus size={20} />
                Add Activity
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* ── ADD / EDIT ACTIVITY SHEET ── */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-[32px] p-6 overflow-y-auto"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)", maxHeight: "90vh" }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    {editingItem ? "Edit Activity" : `Add to Day ${activeDay}`}
                  </h3>
                  {editingItem && (
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Day {editingItem.day}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingItem && (
                    <motion.button
                      whileTap={{ scale: 0.90 }}
                      onClick={() => { removeItem(editingItem._id); closeSheet(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-500 text-xs font-bold"
                    >
                      <Trash2 size={12} /> Delete
                    </motion.button>
                  )}
                  <button onClick={closeSheet} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <X size={16} className="text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newItem.title}
                  onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                  placeholder="Activity name *"
                  className="w-full px-4 py-3.5 rounded-[16px] bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-400 transition-colors"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={newItem.time}
                    onChange={e => setNewItem(p => ({ ...p, time: e.target.value }))}
                    className="px-4 py-3.5 rounded-[16px] bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:border-teal-400 transition-colors"
                  />
                  <div className="flex flex-col">
                    <input
                      type="number"
                      value={newItem.budget === "" ? "" : newItem.budget}
                      onChange={e => {
                        const valStr = e.target.value;
                        const val = valStr === "" ? "" : (parseFloat(valStr) || 0);
                        setNewItem(p => ({ ...p, budget: val }));
                        
                        const limitBudget = trip?.budget || 0;
                        const valNum = Number(val) || 0;
                        if (valStr !== "" && valNum < 0) {
                          setBudgetError("Expense amount cannot be negative.");
                        } else if (valStr !== "" && (valNum + otherItemsExpenses > limitBudget)) {
                          setBudgetError("Expense exceeds available trip budget.");
                        } else {
                          setBudgetError("");
                        }
                      }}
                      onBlur={e => {
                        const valStr = e.target.value;
                        const val = valStr === "" ? "" : (parseFloat(valStr) || 0);
                        const limitBudget = trip?.budget || 0;
                        const valNum = Number(val) || 0;
                        if (valStr !== "" && valNum < 0) {
                          setBudgetError("Expense amount cannot be negative.");
                        } else if (valStr !== "" && (valNum + otherItemsExpenses > limitBudget)) {
                          setBudgetError("Expense exceeds available trip budget.");
                        } else {
                          setBudgetError("");
                        }
                      }}
                      placeholder="Budget (₹)"
                      className={`w-full px-4 py-3.5 rounded-[16px] bg-slate-50 border text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none transition-colors ${
                        budgetError ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-teal-400"
                      }`}
                    />
                    {budgetError && (
                      <span className="text-[10px] text-red-500 font-semibold mt-1 pl-1">
                        {budgetError}
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={newItem.place}
                  onChange={e => setNewItem(p => ({ ...p, place: e.target.value }))}
                  placeholder="Location / Place"
                  className="w-full px-4 py-3.5 rounded-[16px] bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-400 transition-colors"
                />
                <textarea
                  value={newItem.note || ""}
                  onChange={e => setNewItem(p => ({ ...p, note: e.target.value }))}
                  placeholder="Additional notes/reminders..."
                  className="w-full px-4 py-3 rounded-[16px] bg-slate-50 border border-slate-200 text-sm text-slate-700 outline-none focus:border-teal-400 resize-none h-16"
                />

                {/* Category picker */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {CATEGORY_LIST.map(cat => {
                    const cfg = CATEGORY_ICONS[cat];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={cat}
                        onClick={() => setNewItem(p => ({ ...p, category: cat }))}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold transition-all ${
                          newItem.category === cat ? "border-teal-400" : "border-slate-200 bg-white"
                        }`}
                        style={newItem.category === cat ? { background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}40` } : {}}
                      >
                        <Icon size={12} />
                        {cat}
                      </button>
                    );
                  })}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={editingItem ? updateItem : addItem}
                  disabled={!newItem.title || !!budgetError || (trip?.budget - (otherItemsExpenses + (Number(newItem.budget) || 0)) < 0)}
                  className="w-full py-4 rounded-full text-white font-bold text-sm shadow-brand disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                >
                  {editingItem ? (
                    <><Check size={16} className="inline mr-1" />Update Activity</>
                  ) : (
                    <><Plus size={16} className="inline mr-1" />Add Activity</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Status Picker Bottom Sheet */}
      <BottomSheet
        isOpen={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        title="Update Trip Status"
        snapPoints={["40vh"]}
      >
        <div className="space-y-3">
          {Object.keys(STATUS_CONFIG).map((key) => {
            const cfg = STATUS_CONFIG[key];
            const isSelected = trip.status === key;
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpdateStatus(key)}
                className={`w-full flex items-center justify-between p-4 rounded-[20px] border transition-colors ${
                  isSelected 
                    ? "border-teal-400 bg-teal-50/30 text-teal-800" 
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="text-sm font-bold">{cfg.label}</span>
                <span className={`w-3.5 h-3.5 rounded-full ${cfg.bg}`} />
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Collaborators Bottom Sheet */}
      <BottomSheet
        isOpen={collabSheetOpen}
        onClose={() => setCollabSheetOpen(false)}
        title="Trip Collaboration"
        snapPoints={["75vh"]}
      >
        <div className="p-4 space-y-4">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCollabTab("members")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-center transition-all ${
                collabTab === "members" ? "bg-white text-slate-800 shadow-xs dark:bg-slate-700 dark:text-white" : "text-slate-400"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setCollabTab("logs")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-center transition-all ${
                collabTab === "logs" ? "bg-white text-slate-800 shadow-xs dark:bg-slate-700 dark:text-white" : "text-slate-400"
              }`}
            >
              Activity Log
            </button>
          </div>

          {collabTab === "members" ? (
            <div className="space-y-4">
              {/* Invite Section (Owner Only) */}
              {trip?.role === "owner" && (
                <form onSubmit={handleInvite} className="space-y-3 mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invite Co-Planner</p>
                  <div className="space-y-2">
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="Friend's email address..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 transition-colors"
                    />
                    <div className="flex gap-2">
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                        className="flex-1 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400"
                      >
                        <option value="editor">Editor (Can plan/edit)</option>
                        <option value="viewer">Viewer (Read-only)</option>
                      </select>
                      <button
                        type="submit"
                        disabled={inviting || !inviteEmail}
                        className="px-5 py-3 rounded-xl text-white font-bold text-xs bg-indigo-600 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {inviting ? "Sending..." : "Send Invite"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Co-Planners</p>
                
                {/* Owner Entry */}
                <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-extrabold">
                    👑
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Trip Creator (Owner)</p>
                    <p className="text-[9px] font-bold mt-0.5 flex items-center gap-1">
                      {onlineUsers.has((trip?.owner?._id || trip?.owner || trip?.user?._id || trip?.user)?.toString()) ? (
                        <span className="text-emerald-500 flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Online
                        </span>
                      ) : lastActiveTimes[(trip?.owner?._id || trip?.owner || trip?.user?._id || trip?.user)?.toString()] ? (
                        <span className="text-slate-400">
                          Last active {formatLastActive(lastActiveTimes[(trip?.owner?._id || trip?.owner || trip?.user?._id || trip?.user)?.toString()])}
                        </span>
                      ) : (
                        <span className="text-slate-400">Offline</span>
                      )}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 uppercase tracking-wider">
                    Owner
                  </span>
                </div>

                {/* Collaborators List */}
                {collaborators.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                    No other co-planners yet. Invite friends to start planning together!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                    {collaborators.map((c) => {
                      const userObj = c.userId || {};
                      const initials = `${userObj.firstName?.[0] || ""}${userObj.lastName?.[0] || ""}`.toUpperCase() || userObj.email?.[0]?.toUpperCase() || "?";
                      const fullName = userObj.firstName ? `${userObj.firstName} ${userObj.lastName}` : userObj.email;
                      const isAccepted = c.acceptedAt !== null;
                      
                      return (
                        <div key={userObj._id || userObj.email} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-b-0">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{fullName}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{userObj.email}</p>
                            {isAccepted && (
                              <p className="text-[9px] font-bold mt-0.5 flex items-center gap-1">
                                {onlineUsers.has(userObj._id?.toString()) ? (
                                  <span className="text-emerald-500 flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Online
                                  </span>
                                ) : lastActiveTimes[userObj._id?.toString()] ? (
                                  <span className="text-slate-400">
                                    Last active {formatLastActive(lastActiveTimes[userObj._id?.toString()])}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Offline</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isAccepted 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900" 
                                : "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                            }`}>
                              {isAccepted ? "Joined" : "Pending"}
                            </span>
                            
                            {/* Role Selection / Actions (Owner Only) */}
                            {trip?.role === "owner" ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={c.role}
                                  onChange={(e) => handleUpdateCollaboratorRole(userObj._id, e.target.value)}
                                  className="px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none"
                                >
                                  <option value="editor">Editor</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveCollaborator(userObj._id)}
                                  className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 flex items-center justify-center active:scale-90"
                                  title="Remove member"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                {c.role}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Activity Logs Tab */
            <div className="space-y-3">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Recent Activity</p>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                    No activity logs recorded yet. Changes will be logged here.
                  </div>
                ) : (
                  activityLogs.map((log) => {
                    const userObj = log.user || {};
                    const name = userObj.firstName ? `${userObj.firstName} ${userObj.lastName}` : userObj.email || "Someone";
                    return (
                      <div key={log._id} className="flex gap-2.5 items-start text-xs border-b border-slate-50 dark:border-slate-800 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-700 dark:text-slate-350 leading-normal">
                            <span className="text-slate-900 dark:text-white font-extrabold">{name}</span> {log.action}
                          </p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">
                            {formatLogTime(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ── FLIGHTS BOTTOM SHEET ── */}
      <BottomSheet
        isOpen={flightSheetOpen}
        onClose={() => { setFlightSheetOpen(false); setEditingFlight(null); setShowManualFields(false); }}
        title="Trip Flights ✈️"
        snapPoints={["85vh"]}
      >
        <div className="space-y-4 pb-6">
          {/* Sub-tabs: View Flights vs Add/Edit Flight */}
          {!editingFlight && (
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setShowManualFields(false); }}
                className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
                  !showManualFields ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
                }`}
              >
                Active Flights ({flights.length})
              </button>
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => { setShowManualFields(true); setFlightForm({
                    flightNumber: "",
                    airline: "",
                    departureDate: trip?.startDate ? trip.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
                    manualDetails: {
                      departureAirport: "",
                      arrivalAirport: "",
                      departureTime: "",
                      arrivalTime: "",
                      terminal: "",
                      gate: "",
                      status: "scheduled",
                      delayMinutes: 0,
                    }
                  }); }}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
                    showManualFields ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-400"
                  }`}
                >
                  Add Flight
                </button>
              )}
            </div>
          )}

          {editingFlight ? (
            /* Edit Flight Form */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Edit Flight {editingFlight.flightNumber}</h4>
                <button type="button" onClick={() => setEditingFlight(null)} className="text-xs font-bold text-teal-600 underline">Cancel</button>
              </div>
              {renderFlightForm()}
            </div>
          ) : showManualFields ? (
            /* Add Flight Form */
            renderFlightForm()
          ) : (
            /* Flights List */
            <div className="space-y-3">
              {flights.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-semibold">
                  <span className="text-4xl block mb-2">✈️</span>
                  No flights added to this trip.
                </div>
              ) : (
                flights.map(f => (
                  <div key={f._id} className="premium-card p-4 border border-slate-100 dark:border-slate-800 relative bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider mr-2">{f.airline}</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">{f.flightNumber}</span>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                        f.status === "scheduled" ? "bg-emerald-100 text-emerald-800" :
                        f.status === "boarding" ? "bg-blue-100 text-blue-800" :
                        f.status === "delayed" ? "bg-amber-100 text-amber-800" :
                        f.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-teal-100 text-teal-800"
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Departure</p>
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{f.departureAirport || "N/A"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {f.departureTime ? new Date(f.departureTime).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Arrival</p>
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{f.arrivalAirport || "N/A"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {f.arrivalTime ? new Date(f.arrivalTime).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Terminal / Gate</p>
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
                          {f.terminal ? `T${f.terminal}` : "—"} {f.gate ? ` · Gate ${f.gate}` : ""}
                        </p>
                      </div>
                      {f.delayMinutes > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Delay</p>
                          <p className="text-xs font-extrabold text-amber-600 mt-0.5">{f.delayMinutes} mins</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleRefreshFlight(f._id)}
                        disabled={refreshingFlightId === f._id}
                        className="flex items-center gap-1 text-[11px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1.5 rounded-full active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Clock size={11} className={refreshingFlightId === f._id ? "animate-spin" : ""} />
                        {refreshingFlightId === f._id ? "Refreshing..." : "Refresh Live"}
                      </button>
                      
                      {!isViewer && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFlight(f);
                              setFlightForm({
                                flightNumber: f.flightNumber,
                                airline: f.airline,
                                departureDate: f.departureTime ? new Date(f.departureTime).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                manualDetails: {
                                  departureAirport: f.departureAirport,
                                  arrivalAirport: f.arrivalAirport,
                                  departureTime: f.departureTime ? new Date(f.departureTime).toISOString().substring(0, 16) : "",
                                  arrivalTime: f.arrivalTime ? new Date(f.arrivalTime).toISOString().substring(0, 16) : "",
                                  terminal: f.terminal,
                                  gate: f.gate,
                                  status: f.status,
                                  delayMinutes: f.delayMinutes,
                                }
                              });
                            }}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFlight(f._id)}
                            className="p-1.5 bg-red-50 dark:bg-red-950/20 rounded-full text-red-500 active:scale-90"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ── TRIP GROUP CHAT BOTTOM SHEET ── */}
      <BottomSheet
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Trip Chat"
        snapPoints={["85vh"]}
        contentPadding="p-0"
      >
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 rounded-t-[28px]">
          {/* Chat Header Actions / Search Row */}
          <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {showChatSearch ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search messages..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-400 transition-colors"
                    aria-label="Search chat messages"
                  />
                  {searchMatches.length > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold mr-1.5">
                        {searchIndex + 1}/{searchMatches.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchIndex(prev => (prev === 0 ? searchMatches.length - 1 : prev - 1))}
                        className="text-slate-600 dark:text-slate-300 font-bold text-[10px] px-1 hover:text-teal-500"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => setSearchIndex(prev => (prev === searchMatches.length - 1 ? 0 : prev + 1))}
                        className="text-slate-600 dark:text-slate-300 font-bold text-[10px] px-1 hover:text-teal-500"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                    {Object.values(typingUsers).length > 0 ? (
                      <span className="text-teal-600 dark:text-teal-400 italic animate-pulse">
                        💬 {Object.values(typingUsers).join(", ")} is typing...
                      </span>
                    ) : (
                      `💬 Chat Room • ${trip?.title || "Discussion"}`
                    )}
                  </p>
                  {pendingSync && (
                    <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                      Pending Sync
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowChatSearch(!showChatSearch);
                if (showChatSearch) setChatSearch("");
              }}
              className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Toggle search"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Pinned Messages Header Banner */}
          {(() => {
            const pinnedMessages = chatMessages.filter(m => m.pinned && !m.deletedAt);
            if (pinnedMessages.length === 0) return null;
            const currentPin = pinnedMessages[currentPinIndex] || pinnedMessages[0];
            if (!currentPin) return null;
            return (
              <div className="bg-teal-50 dark:bg-slate-900 border-b border-teal-100 dark:border-teal-800 px-4 py-2 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-teal-600 dark:text-teal-400 flex-shrink-0">📌</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Pinned Message {pinnedMessages.length > 1 ? `(${currentPinIndex + 1}/${pinnedMessages.length})` : ""}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 truncate font-semibold">
                      {currentPin.messageType === "image" ? "📷 Attached Image" : currentPin.messageType === "voice" ? "🎵 Voice Message" : currentPin.messageType === "location" ? "📍 Location Pin" : currentPin.messageType === "itineraryItem" ? "🗓️ Shared Activity" : currentPin.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pinnedMessages.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPinIndex(prev => (prev === 0 ? pinnedMessages.length - 1 : prev - 1))}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setCurrentPinIndex(prev => (prev === pinnedMessages.length - 1 ? 0 : prev + 1))}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
                      >
                        →
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const msgEl = document.getElementById(`msg-${currentPin._id}`);
                      if (msgEl) {
                        msgEl.scrollIntoView({ behavior: "smooth", block: "center" });
                        msgEl.classList.add("bg-teal-500/20");
                        setTimeout(() => msgEl.classList.remove("bg-teal-500/20"), 2000);
                      }
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-teal-600"
                  >
                    View
                  </button>
                  {!isViewer && (
                    <button
                      onClick={() => handleTogglePin(currentPin._id, false)}
                      className="text-slate-400 hover:text-rose-500 text-[10px] font-bold"
                    >
                      Unpin
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Messages Stream */}
          <div
            ref={messagesContainerRef}
            onScroll={(e) => {
              if (e.currentTarget.scrollTop === 0 && !chatLoading && hasMoreMessages) {
                const sh = e.currentTarget.scrollHeight;
                loadMoreMessages().then(() => {
                  setTimeout(() => {
                    if (messagesContainerRef.current) {
                      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - sh;
                    }
                  }, 50);
                });
              }
            }}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 dark:bg-slate-950"
            style={{ maxHeight: "calc(85vh - 180px)", minHeight: "40vh" }}
          >
            {chatLoading && chatMessages.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-teal-200 border-t-teal-500 animate-spin" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-slate-500">
                <span className="text-5xl mb-3">💬</span>
                <p className="text-sm font-bold">Start the conversation!</p>
                <p className="text-[11px] mt-1 max-w-[200px]">Only trip collaborators can access and participate in this chat.</p>
              </div>
            ) : (
              chatMessages.map((m) => {
                  const isMe = m.sender === user?.id || m.sender === user?._id || m.sender?.toString() === user?.id?.toString() || m.sender?.toString() === user?._id?.toString() || m.isPending;
                  const initials = m.senderName ? m.senderName.split(" ").map(n => n[0]).join("").toUpperCase() : "?";
                  
                  // Helper to highlight matches
                  const highlightMatch = (text, search) => {
                    if (!search || !text) return text;
                    const parts = text.split(new RegExp(`(${search})`, "gi"));
                    return (
                      <span>
                        {parts.map((part, i) =>
                          part.toLowerCase() === search.toLowerCase() ? (
                            <mark key={i} className="bg-amber-100 text-amber-950 rounded-[4px] px-0.5 font-semibold">{part}</mark>
                          ) : (
                            part
                          )
                        )}
                      </span>
                    );
                  };

                  // Seen double checks checkmark helper
                  const getCheckmarks = () => {
                    if (m.isPending) {
                      return <span className="text-slate-400 text-[10px] ml-1 animate-pulse">⏰</span>;
                    }
                    const otherUsersSeen = Object.entries(seenStates).some(([uId, seenTime]) => {
                      const myIdStr = (user?.id || user?._id || "").toString();
                      return uId !== myIdStr && new Date(seenTime) >= new Date(m.createdAt);
                    });
                    if (otherUsersSeen) {
                      return <span className="text-teal-500 font-extrabold text-[10px] ml-1">✓✓</span>;
                    }
                    return <span className="text-slate-400 text-[10px] ml-1">✓</span>;
                  };

                  // Group reactions count helper
                  const groupedReactions = {};
                  m.reactions?.forEach((r) => {
                    groupedReactions[r.emoji] = (groupedReactions[r.emoji] || 0) + 1;
                  });

                  return (
                    <div
                      key={m._id}
                      className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {/* Avatar */}
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold border border-slate-300 dark:border-slate-700 flex-shrink-0">
                          {m.senderAvatar ? (
                            <img src={m.senderAvatar} className="w-full h-full rounded-full object-cover" alt={m.senderName} />
                          ) : (
                            initials
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="space-y-1 min-w-0">
                        {/* Sender Label */}
                        {!isMe && (
                          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block px-1 truncate">{m.senderName}</span>
                        )}

                        {/* Bubble */}
                        <div
                          id={`msg-${m._id}`}
                          onTouchStart={() => handleTouchStart(m._id)}
                          onTouchEnd={() => handleTouchEnd(m._id)}
                          onMouseDown={() => handleTouchStart(m._id)}
                          onMouseUp={() => handleTouchEnd(m._id)}
                          onMouseLeave={() => handleTouchEnd(m._id)}
                          className={`p-3 rounded-[22px] border relative ${
                            isMe 
                              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-teal-400 shadow-sm rounded-tr-[4px]" 
                              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 shadow-xs rounded-tl-[4px]"
                          }`}
                        >
                          {/* Long Press Reaction Picker */}
                          {longPressActive === m._id && !m.deletedAt && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-md flex gap-1.5 z-30 mb-1.5">
                              {["❤️", "👍", "🔥", "😂"].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReaction(m._id, emoji);
                                    setLongPressActive(null);
                                  }}
                                  className="hover:scale-125 transition-transform text-sm"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Reply Context Render */}
                          {(m.replyTo || m.replyToDetails) && (() => {
                            const parentId = m.replyTo && typeof m.replyTo === "object" ? m.replyTo.messageId : m.replyTo;
                            const senderName = m.replyTo && typeof m.replyTo === "object" ? m.replyTo.senderName : m.replyToDetails?.senderName;
                            const preview = m.replyTo && typeof m.replyTo === "object" ? m.replyTo.preview : (m.replyToDetails?.messageType === "image" ? "📷 Image" : m.replyToDetails?.messageType === "voice" ? "🎵 Voice Message" : m.replyToDetails?.messageType === "location" ? "📍 Location Pin" : m.replyToDetails?.messageType === "itineraryItem" ? "🗓️ Shared Activity" : m.replyToDetails?.message);

                            return (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (parentId) {
                                    const element = document.getElementById(`msg-${parentId}`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: "smooth", block: "center" });
                                      element.classList.add("highlight-msg-effect");
                                      setTimeout(() => {
                                        element.classList.remove("highlight-msg-effect");
                                      }, 2000);
                                    }
                                  }
                                }}
                                className={`p-2 rounded-xl mb-2 text-[10px] border-l-2 cursor-pointer hover:opacity-85 transition-all ${
                                  isMe ? "bg-white/10 border-white text-white/90" : "bg-slate-50 dark:bg-slate-800 border-teal-500 text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                <p className="font-bold">{senderName}</p>
                                <p className="truncate mt-0.5">{preview}</p>
                              </div>
                            );
                          })()}

                          {/* Image Attachment Render */}
                          {m.messageType === "image" && m.fileUrl && (
                            <div className="rounded-lg overflow-hidden mb-1.5 max-w-[240px]">
                              <img src={m.fileUrl} className="w-full h-auto object-cover max-h-[160px]" alt="Attached file" />
                            </div>
                          )}

                          {/* Voice Message Render */}
                          {m.messageType === "voice" && m.fileUrl && !m.deletedAt && (
                            <div className="mt-1 flex items-center gap-2 max-w-[240px]">
                              <audio src={m.fileUrl} controls className="w-full h-8 rounded-lg outline-none" style={{ filter: isMe ? "invert(1) hue-rotate(180deg)" : "none" }} />
                            </div>
                          )}

                          {/* GPS Location Render */}
                          {m.messageType === "location" && m.location && !m.deletedAt && (
                            <div className={`p-2.5 rounded-xl border mt-1 flex flex-col gap-2 max-w-[240px] ${isMe ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">📍</span>
                                <span className="text-[11px] font-bold leading-tight">{m.location.address || "Shared Location"}</span>
                              </div>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${m.location.latitude},${m.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`py-1.5 rounded-lg text-[9px] font-extrabold text-center uppercase tracking-wide transition-all ${isMe ? "bg-white text-teal-600 active:bg-white/95" : "bg-teal-500 text-white active:bg-teal-600"}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Open In Maps
                              </a>
                            </div>
                          )}

                          {/* Shared Activity (Itinerary Item) Render */}
                          {m.messageType === "itineraryItem" && m.itineraryItem && !m.deletedAt && (
                            <div className={`p-2.5 rounded-xl border mt-1 flex flex-col gap-2 max-w-[240px] ${isMe ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ background: isMe ? "rgba(255,255,255,0.2)" : "rgba(20,184,181,0.1)", color: isMe ? "#ffffff" : "#14B8B5" }}>
                                  {m.itineraryItem.category}
                                </span>
                                <span className="text-[10px] opacity-80 flex items-center gap-0.5"><Clock size={9} /> {m.itineraryItem.time}</span>
                              </div>
                              <p className="text-xs font-bold truncate">{m.itineraryItem.title}</p>
                              {m.itineraryItem.place && <p className="text-[9px] opacity-75 truncate mt-0.5 flex items-center gap-0.5"><MapPin size={9} /> {m.itineraryItem.place}</p>}
                            </div>
                          )}

                          {/* Text Message Render */}
                          {m.deletedAt ? (
                            <p className="text-xs italic opacity-60">This message was deleted</p>
                          ) : (
                            m.messageType !== "voice" && m.messageType !== "location" && m.messageType !== "itineraryItem" && (
                              <p className="text-xs leading-relaxed break-words font-medium">
                                {highlightMatch(m.message, chatSearch)}
                              </p>
                            )
                          )}

                          {/* Timestamp and Checkmarks */}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-60">
                            <span>{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && getCheckmarks()}
                          </div>
                        </div>

                        {/* Reactions and Options Line */}
                        {!m.deletedAt && (
                          <div className={`flex items-center gap-1.5 px-1 mt-1 flex-wrap ${isMe ? "justify-end" : ""}`}>
                            {/* Reactions pills */}
                            {Object.entries(groupedReactions).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(m._id, emoji)}
                                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-500 hover:scale-105 active:scale-95 transition-all"
                              >
                                <span>{emoji}</span>
                                <span>{count}</span>
                              </button>
                            ))}

                            {/* Easy picker (+ reaction trigger) */}
                            <div className="relative group/picker">
                              <button className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
                                +
                              </button>
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 scale-0 group-hover/picker:scale-100 transition-transform origin-bottom bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-md flex gap-1 z-30">
                                {["👍", "❤️", "🔥", "😂", "👏"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(m._id, emoji)}
                                    className="hover:scale-125 transition-transform"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Actions links */}
                            <button
                              onClick={() => setReplyingTo(m)}
                              className="text-[9px] font-bold text-slate-400 hover:text-teal-600 transition-colors"
                            >
                              Reply
                            </button>

                            {!isViewer && (
                              <button
                                onClick={() => handleTogglePin(m._id, !m.pinned)}
                                className={`text-[9px] font-bold transition-colors ${m.pinned ? "text-teal-600 hover:text-teal-700" : "text-slate-400 hover:text-teal-600"}`}
                              >
                                {m.pinned ? "Unpin" : "Pin"}
                              </button>
                            )}

                            {isMe && !m.isPending && (
                              <button
                                onClick={() => handleDeleteChatMessage(m._id)}
                                className="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Context & Image Attachment Previews */}
          <div className="px-4 bg-slate-50 dark:bg-slate-950">
            {replyingTo && (
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 border-l-4 border-teal-500 px-3.5 py-2.5 text-xs rounded-xl mb-2 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Replying to {replyingTo.senderName}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                    {replyingTo.messageType === "image" ? "📷 Attached Image" : replyingTo.message}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Cancel reply"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {imagePreview && (
              <div className="relative inline-block w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-1 mb-2 bg-white dark:bg-slate-900 shadow-xs">
                <img src={imagePreview} className="w-full h-full object-cover rounded-xl" alt="Selected upload file preview" />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-1 right-1 bg-slate-950/80 text-white rounded-full p-1 hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Remove image"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Chat Form Entry Panel */}
          <div className="px-4">
            {isRecording ? (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl border border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-red-500 font-extrabold text-xs animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>Recording: {formatDuration(recordingDuration)}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">(Max 10MB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stopRecording(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => stopRecording(false)}
                    className="p-2.5 bg-red-500 text-white rounded-xl active:scale-95 flex items-center justify-center shadow-md shadow-red-500/20"
                    title="Stop and Send"
                  >
                    <Square size={14} fill="#ffffff" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendChatMessage} className="w-full min-w-0 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xs border">
                <label className="cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 transition-colors" title="Attach photo">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                
                <button
                  type="button"
                  onClick={shareGPSLocation}
                  className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 transition-colors"
                  title="Share GPS Location"
                >
                  <MapPin size={16} />
                </button>

                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 transition-colors"
                  title="Record voice note"
                >
                  <Mic size={16} />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-400 transition-colors"
                  aria-label="Chat input field"
                />
                
                <button
                  type="submit"
                  disabled={isSending || (!chatInput.trim() && !imagePreview)}
                  className="p-2.5 bg-teal-500 active:scale-95 disabled:opacity-50 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-[0_4px_12px_rgba(20,184,181,0.2)]"
                  aria-label="Send message"
                >
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* ── AI TRAVEL ASSISTANT BOTTOM SHEET ── */}
      <BottomSheet
        isOpen={aiSheetOpen}
        onClose={() => setAiSheetOpen(false)}
        title="AI Travel Assistant"
        snapPoints={["85vh"]}
        contentPadding="p-0"
      >
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 rounded-t-[28px]">
          {/* Prompt Suggestion Chips */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Suggested Prompts</p>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {[
                { label: "📦 Packing checklist", prompt: "What should I pack for this trip?" },
                { label: "🚨 Emergency info", prompt: "What emergency contact numbers or hospitals should I know about?" },
                { label: "🍛 Local food guide", prompt: "What are the must-try dishes and best restaurants nearby?" },
                { label: "🗺️ 1-Day detailed itinerary", prompt: "Plan a detailed 1-day exploration itinerary." }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setAiPrompt(chip.prompt)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-slate-950" style={{ maxHeight: "calc(85vh - 210px)", minHeight: "40vh" }}>
            {aiMessages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div key={idx} className={`flex max-w-[85%] ${isUser ? "ml-auto" : "mr-auto"}`}>
                  <div className={`p-3.5 rounded-[22px] border ${
                    isUser
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-violet-400 shadow-sm rounded-tr-[4px]"
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 shadow-xs rounded-tl-[4px]"
                  }`}>
                    <p className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                      {isUser ? "You" : "Traveloop Assistant 🤖"}
                    </p>
                    <div className="text-xs leading-relaxed font-medium markdown-body break-words">
                      {msg.content.split("\n").map((para, pIdx) => (
                        <p key={pIdx} className="mb-1.5 last:mb-0">{para}</p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {aiLoading && (
              <div className="flex max-w-[85%] mr-auto items-center gap-2">
                <div className="p-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-[22px] border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Prompt Entry Form */}
          <div className="px-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAiAssistantQuery(aiPrompt);
              }}
              className="w-full min-w-0 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xs border"
            >
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask assistant anything..."
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-400 transition-colors"
                aria-label="AI prompt field"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiPrompt.trim()}
                className="p-2.5 bg-teal-500 active:scale-95 disabled:opacity-50 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-[0_4px_12px_rgba(20,184,181,0.2)]"
                aria-label="Send query"
              >
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      </BottomSheet>

      {exporting && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md text-white">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin mb-4" />
          <p className="text-sm font-bold animate-pulse">Exporting PDF...</p>
        </div>
      )}

      {/* ── SHARE CARD MODAL ── */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              {/* Boarding Pass header */}
              <div className="bg-[#0B1325] text-white p-5 relative overflow-hidden flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white">
                    <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-black tracking-tight">TRAVELOOP PASS</span>
                </div>
                <span className="text-teal-400 font-extrabold text-[10px] tracking-widest uppercase bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  BOARDING CARD
                </span>
                {/* Decorative circles on header */}
                <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-slate-900/60 backdrop-blur-md" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-slate-900/60 backdrop-blur-md" />
              </div>

              {/* Pass details */}
              <div className="p-6 bg-slate-50/55 flex-1 relative">
                {/* Left/Right dotted cutout line decoration */}
                <div className="absolute top-0 inset-x-0 flex items-center justify-between -mt-3 px-3">
                  <div className="w-3 h-3 rounded-full bg-slate-900/10 -ml-1.5" />
                  <div className="flex-1 border-t border-dashed border-slate-200 mx-2" />
                  <div className="w-3 h-3 rounded-full bg-slate-900/10 -mr-1.5" />
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Passenger Name</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Traveler"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Destination</span>
                      <span className="text-sm font-extrabold text-teal-600 flex items-center gap-1">
                        📍 {trip?.destination || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Trip Duration</span>
                      <span className="text-sm font-extrabold text-slate-800">
                        🗓️ {days} days
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Start Date</span>
                      <span className="text-xs font-bold text-slate-700">
                        {trip?.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">End Date</span>
                      <span className="text-xs font-bold text-slate-700">
                        {trip?.endDate ? new Date(trip.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Decorative Barcode */}
                  <div className="flex flex-col items-center pt-3 border-t border-slate-100">
                    <div className="w-full h-12 flex items-center justify-around px-2 bg-white rounded-lg border border-slate-100">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-8 bg-slate-850 rounded-xs"
                          style={{
                            width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px`,
                            opacity: i % 5 === 0 ? 0.3 : 1
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-widest">
                      TRVLP-{trip?._id?.substring(0, 8) || "SHARE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success("Link copied!");
                  }}
                  className="w-full py-3 rounded-full text-white font-bold text-xs bg-gradient-to-r from-teal-500 to-cyan-500 shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Copy Public Share Link
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3 rounded-full text-slate-500 font-bold text-xs bg-slate-100 hover:bg-slate-200 active:scale-98 transition-all"
                >
                  Close Pass
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default BuildItinerary;