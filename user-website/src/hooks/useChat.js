// src/hooks/useChat.js
// Custom hook for managing Traveloop AI Chatbot state and Backend communication.

import { useState, useCallback, useEffect, useRef } from "react";
import { sendChatMessage } from "../services/aiService";
import { useAuth } from "../context/AuthContext";

const DEFAULT_WELCOME = (userName) => ({
  id: "welcome-1",
  role: "ai",
  text: `👋 Hello ${userName || "Traveler"}!\nWhere would you like to travel today? Ask me anything about destinations, itineraries, budgets, or group trip packages.`,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  trips: [],
  followUps: [
    "Suggest weekend trips under ₹5000",
    "Best hill stations for group tours",
    "Plan a 5-day adventure trip to Bali",
  ],
});

export const useChat = () => {
  const { user } = useAuth();
  const userName = user?.displayName || user?.name || user?.email?.split("@")[0] || "Traveler";

  const [messages, setMessages] = useState(() => [DEFAULT_WELCOME(userName)]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const sessionIdRef = useRef(null);

  // Get or initialize tab-scoped session ID
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      let sid = sessionStorage.getItem("ai_session_id");
      if (!sid) {
        sid = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem("ai_session_id", sid);
      }
      sessionIdRef.current = sid;
    }
    return sessionIdRef.current;
  }, []);

  // Sync welcome message if user logs in / updates name
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome-1") {
        return [DEFAULT_WELCOME(userName)];
      }
      return prev;
    });
  }, [userName]);

  // Send message to AI Backend gateway
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || loading) return;

      const userMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        trips: [],
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setLastFailedMessage(null);
      setIsOnline(true);

      try {
        const sid = getSessionId();
        const result = await sendChatMessage(trimmed, sid);

        if (!result || (result.success === false && !result.response)) {
          throw new Error(result?.message || "AI Service unavailable");
        }

        const aiTrips = result.recommended_trips || result.retrieved_trips || [];
        const followUps = result.follow_up_questions || result.preferences_detected || [];
        const isFallback = result.exact_match_found === false && aiTrips.length === 0;

        let responseText = result.response || "Here are some recommendations matching your request.";
        if (isFallback) {
          responseText = `🤖 I couldn't find an exact match for your request.\nHere are similar destinations you may like.\n\nYour request has been recorded. Our travel partners may publish a matching trip soon!`;
        }

        const aiMsg = {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          trips: aiTrips,
          followUps,
          isFallback,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        console.error("[useChat] Error sending message:", err);
        setIsOnline(false);
        setLastFailedMessage(trimmed);

        const errorMsg = {
          id: `err-${Date.now()}`,
          role: "ai",
          text: "⚠️ Connection issue. Unable to connect to Traveloop AI right now. Please check your connection and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
          trips: [],
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading, getSessionId]
  );

  const retryLastMessage = useCallback(() => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  }, [lastFailedMessage, sendMessage]);

  const clearHistory = useCallback(() => {
    setMessages([DEFAULT_WELCOME(userName)]);
    setLastFailedMessage(null);
  }, [userName]);

  return {
    messages,
    loading,
    isOnline,
    lastFailedMessage,
    sendMessage,
    retryLastMessage,
    clearHistory,
    userName,
  };
};

export default useChat;
