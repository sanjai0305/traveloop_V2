// services/aiService.js
// Central reusable client for all AI Service calls.
// The Backend is the ONLY gateway — frontends never call the AI Service directly.

import axios from "axios";

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000, // 30s — AI responses can take time
  headers: { "Content-Type": "application/json" },
});

// ── Unified error wrapper ──────────────────────────────────────────────────
// Never crashes the Backend. Always returns a structured error object.
const safeCall = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.error || err.message || "AI Service unavailable";
    console.error(`[AI Service] Error (${status || "network"}): ${detail}`);
    return fallback;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /chat
// Memory-aware travel assistant conversation
// ─────────────────────────────────────────────────────────────────────────────
export const chat = async (userId, sessionId, message) => {
  return safeCall(
    async () => {
      const { data } = await aiClient.post("/chat", {
        user_id: userId,
        session_id: sessionId,
        message,
      });
      return data;
    },
    {
      success: false,
      response: "I'm having trouble connecting right now. Please try again in a moment.",
      memory_updated: false,
      preferences_detected: [],
    }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /search
// Semantic RAG trip search with intent recording
// ─────────────────────────────────────────────────────────────────────────────
export const search = async (userId, sessionId, query) => {
  return safeCall(
    async () => {
      const { data } = await aiClient.post("/search", {
        user_id: userId,
        session_id: sessionId,
        query,
      });
      return data;
    },
    {
      success: false,
      answer: null,
      retrieved_trips: [],
      demand_recorded: false,
      exact_match_found: false,
      message: "Search service temporarily unavailable.",
    }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /recommendations
// Personalized trip recommendations for a user
// ─────────────────────────────────────────────────────────────────────────────
export const getRecommendations = async (userId) => {
  return safeCall(
    async () => {
      const { data } = await aiClient.get("/recommendations", {
        params: { user_id: userId },
        headers: { "X-User-ID": userId },
      });
      return data;
    },
    {
      recommendations: [],
      dashboard_sections: {},
    }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /analytics
// Business intelligence dashboard data
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalytics = async (filters = {}) => {
  return safeCall(
    async () => {
      const { data } = await aiClient.get("/analytics", { params: filters });
      return data;
    },
    null
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /demands
// Travel demand intelligence for agent/admin dashboards
// ─────────────────────────────────────────────────────────────────────────────
export const getDemands = async (filters = {}) => {
  return safeCall(
    async () => {
      const { data } = await aiClient.get("/demands", { params: filters });
      return data;
    },
    null
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /embed-trip
// Ingest a published trip into the Qdrant vector DB.
// Called fire-and-forget after an agent publishes a trip.
// ─────────────────────────────────────────────────────────────────────────────
export const embedTrip = async (trip) => {
  const payload = {
    title:       trip.title        || "Untitled Trip",
    destination: trip.destinations?.[0] || trip.destinationCity || trip.title || "Unknown",
    description: trip.description  || trip.subtitle || trip.tagline || trip.title || "",
    budget:      trip.budget       || trip.budgetCategory || trip.priceCategory || "Standard",
    duration:    trip.duration     || (trip.days ? `${trip.days} Days` : "Flexible"),
    tags: [
      trip.tripType,
      trip.category,
      ...(Array.isArray(trip.tags) ? trip.tags : []),
      ...(Array.isArray(trip.destinations) ? trip.destinations : []),
    ].filter(Boolean),
  };

  return safeCall(
    async () => {
      const { data } = await aiClient.post("/embed-trip", payload);
      console.log(`[AI Service] Trip embedded: ${data.trip_id}`);
      return data;
    },
    { success: false, embedded: false }
  );
};

export default {
  chat,
  search,
  getRecommendations,
  getAnalytics,
  getDemands,
  embedTrip,
};
