// src/services/aiService.js
// Frontend AI API service for the User Website.
// Always calls the Node.js Backend — NEVER the AI Service directly.

import { getApiUrl } from "../utils/api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Stable session ID per browser tab (survives page navigation, resets on new tab)
const getSessionId = () => {
  let sid = sessionStorage.getItem("ai_session_id");
  if (!sid) {
    sid = `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("ai_session_id", sid);
  }
  return sid;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// Sends a message to the AI travel assistant.
// Returns: { success, response, preferences_detected, session_id }
// ─────────────────────────────────────────────────────────────────────────────
export const sendChatMessage = async (message, customSessionId = null) => {
  try {
    const res = await fetch(getApiUrl("ai/chat"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        session_id: customSessionId || getSessionId(),
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[aiService] chat error:", err);
    return {
      success: false,
      response: "Connection error. Please check your internet and try again.",
      preferences_detected: [],
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/search
// Semantic AI trip search with intent recording.
// Returns: { success, answer, retrieved_trips, demand_recorded, exact_match_found }
// ─────────────────────────────────────────────────────────────────────────────
export const searchTrips = async (query, customSessionId = null) => {
  try {
    const res = await fetch(getApiUrl("ai/search"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query,
        session_id: customSessionId || getSessionId(),
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[aiService] search error:", err);
    return {
      success: false,
      answer: null,
      retrieved_trips: [],
      demand_recorded: false,
      exact_match_found: false,
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/recommendations
// Personalized trip recommendations for the logged-in user.
// Returns: { success, recommendations, dashboard_sections }
// ─────────────────────────────────────────────────────────────────────────────
export const getUserRecommendations = async () => {
  try {
    const res = await fetch(getApiUrl("ai/recommendations"), {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[aiService] recommendations error:", err);
    return { success: false, recommendations: [], dashboard_sections: {} };
  }
};

export default { sendChatMessage, searchTrips, getUserRecommendations };
