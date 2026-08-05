// controllers/aiController.js
// AI Service gateway controller.
// All routes proxy through the Backend — frontends never call AI Service directly.

import supabase from "../config/supabase.js";
import * as aiService from "../services/aiService.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a stable session ID for a user's AI conversation
// ─────────────────────────────────────────────────────────────────────────────
const buildSessionId = (userId, providedSession) => {
  if (providedSession && /^[A-Za-z0-9_.:-]+$/.test(providedSession)) {
    return providedSession;
  }
  // Default: one session per user per day
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `session-${userId}-${today}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// ─────────────────────────────────────────────────────────────────────────────
export const postChat = async (req, res) => {
  try {
    const userId    = req.user.id || req.user._id?.toString();
    const message   = req.body.message?.trim();
    const sessionId = buildSessionId(userId, req.body.session_id);

    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const result = await aiService.chat(userId, sessionId, message);

    return res.json({
      success:              result.success !== false,
      response:             result.response,
      memory_updated:       result.memory_updated ?? false,
      preferences_detected: result.preferences_detected ?? [],
      session_id:           sessionId,
    });
  } catch (err) {
    console.error("[AI Chat] Unhandled error:", err);
    return res.status(500).json({ success: false, message: "AI chat unavailable" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/search
// ─────────────────────────────────────────────────────────────────────────────
export const postSearch = async (req, res) => {
  try {
    const userId    = req.user.id || req.user._id?.toString();
    const query     = req.body.query?.trim();
    const sessionId = buildSessionId(userId, req.body.session_id);

    if (!query) {
      return res.status(400).json({ success: false, message: "query is required" });
    }

    const result = await aiService.search(userId, sessionId, query);

    return res.json({
      success:           result.success !== false,
      answer:            result.answer,
      retrieved_trips:   result.retrieved_trips   ?? [],
      demand_recorded:   result.demand_recorded   ?? false,
      exact_match_found: result.exact_match_found ?? false,
      message:           result.message,
      session_id:        sessionId,
    });
  } catch (err) {
    console.error("[AI Search] Unhandled error:", err);
    return res.status(500).json({ success: false, message: "AI search unavailable" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/recommendations
// ─────────────────────────────────────────────────────────────────────────────
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id?.toString();
    const result = await aiService.getRecommendations(userId);

    return res.json({
      success:            true,
      recommendations:    result?.recommendations    ?? [],
      dashboard_sections: result?.dashboard_sections ?? {},
    });
  } catch (err) {
    console.error("[AI Recommendations] Unhandled error:", err);
    return res.status(500).json({ success: false, message: "Recommendations unavailable" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/analytics
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const { from, to, destination, budget, theme, user_id, group_type } = req.query;
    const filters = { from, to, destination, budget, theme, user_id, group_type };
    Object.keys(filters).forEach(k => filters[k] === undefined && delete filters[k]);

    const result = await aiService.getAnalytics(filters);

    if (!result) {
      return res.status(503).json({ success: false, message: "Analytics service unavailable" });
    }
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("[AI Analytics] Unhandled error:", err);
    return res.status(500).json({ success: false, message: "Analytics unavailable" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/demands
// ─────────────────────────────────────────────────────────────────────────────
export const getDemands = async (req, res) => {
  try {
    const { from, to, destination, budget, theme, user_id, group_type } = req.query;
    const filters = { from, to, destination, budget, theme, user_id, group_type };
    Object.keys(filters).forEach(k => filters[k] === undefined && delete filters[k]);

    const result = await aiService.getDemands(filters);

    if (!result) {
      return res.status(503).json({ success: false, message: "Demand service unavailable" });
    }
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("[AI Demands] Unhandled error:", err);
    return res.status(500).json({ success: false, message: "Demand intelligence unavailable" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/query — trip-context Gemini assistant
// ─────────────────────────────────────────────────────────────────────────────
export const queryAI = async (req, res) => {
  try {
    const { tripId, prompt } = req.body;
    if (!tripId || !prompt) {
      return res.status(400).json({ success: false, message: "tripId and prompt are required" });
    }

    const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).maybeSingle();
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const [{ data: itinerary }, { data: flights }, { data: checklist }, { data: notes }] = await Promise.all([
      supabase.from("itineraries").select("*").eq("trip_id", tripId).order("day"),
      supabase.from("flights").select("*").eq("trip_id", tripId),
      supabase.from("checklists").select("*").eq("trip_id", tripId),
      supabase.from("notes").select("*").eq("trip_id", tripId),
    ]);

    const context = {
      trip: {
        title: trip.title, destination: trip.destination,
        startDate: trip.start_date, endDate: trip.end_date, budget: trip.budget,
      },
      itinerary: (itinerary || []).map(i => ({ day: i.day, time: i.time, title: i.title })),
      flights:   (flights   || []).map(f => ({ flightNumber: f.flight_number, airline: f.airline })),
      checklist: (checklist || []).map(c => ({ item: c.item, checked: c.checked })),
      notes:     (notes     || []).map(n => ({ title: n.title, content: n.content })),
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "GEMINI_API_KEY is not configured" });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        contents: [{ role: "user", parts: [
          { text: "You are Traveloop's AI Travel Assistant. Assist the user using their trip context." },
          { text: `Context:\n${JSON.stringify(context, null, 2)}\n\nQuestion:\n${prompt}` },
        ]}],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const result       = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return res.json({ success: true, response: responseText });
  } catch (error) {
    console.error("[AI Query] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate AI response." });
  }
};
