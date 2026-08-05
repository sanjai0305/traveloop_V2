// src/services/aiService.ts
// Agent Portal AI service — calls the Node.js Backend gateway.
// Never calls the AI Service directly.

import api from "./api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIRecommendationItem {
  trip_id: string;
  title: string;
  destination: string;
  score: number;
  reason: string;
  thumbnail?: string | null;
  price?: string | null;
  duration?: string | null;
}

export interface AIRecommendationsResponse {
  success: boolean;
  recommendations: AIRecommendationItem[];
  dashboard_sections: Record<string, AIRecommendationItem[]>;
}

export interface DemandItem {
  destination: string;
  demand_score: number;
  users_waiting: number;
  avg_budget: string;
  avg_duration: string;
  theme: string;
  intent_count: number;
}

export interface DemandsResponse {
  success: boolean;
  demands?: DemandItem[];
  top_destinations?: DemandItem[];
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/recommendations
// Returns AI-personalized trip recommendations for the currently logged-in agent.
// Used to populate the "AI Recommended Trips" section on the Trips page.
// ─────────────────────────────────────────────────────────────────────────────
export const getAIRecommendations = async (): Promise<AIRecommendationsResponse> => {
  try {
    const response = await api.get<AIRecommendationsResponse>("/ai/recommendations");
    return response.data;
  } catch (err: unknown) {
    console.warn("[aiService] getAIRecommendations failed:", err);
    return { success: false, recommendations: [], dashboard_sections: {} };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/demands
// Returns travel demand intelligence — what users are searching for.
// Used to surface trending demand to agents so they can create matching trips.
// ─────────────────────────────────────────────────────────────────────────────
export const getAIDemands = async (filters: Record<string, string> = {}): Promise<DemandsResponse> => {
  try {
    const response = await api.get<DemandsResponse>("/ai/demands", { params: filters });
    return response.data;
  } catch (err: unknown) {
    console.warn("[aiService] getAIDemands failed:", err);
    return { success: false, demands: [] };
  }
};

export default { getAIRecommendations, getAIDemands };
