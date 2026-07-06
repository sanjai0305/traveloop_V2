import api from "./api";
import { AgentTrip } from "../types";

/**
 * All agent trip routes are under /api/agent/trips/...
 * (mounted in agentRoutes.js at /api/agent)
 */

export const createTrip = async (tripData: Partial<AgentTrip>): Promise<{ trip: AgentTrip }> => {
  const response = await api.post("/agent/trips/create", tripData);
  return response.data;
};

export const getMyTrips = async (): Promise<{ trips: AgentTrip[] }> => {
  const response = await api.get("/agent/trips/my-trips");
  return response.data;
};

export const getTripById = async (id: string): Promise<{ trip: AgentTrip }> => {
  const response = await api.get(`/agent/trip/${id}`);
  return response.data;
};

export const updateTrip = async (id: string, tripData: Partial<AgentTrip>): Promise<{ trip: AgentTrip }> => {
  const response = await api.put(`/agent/trip/${id}`, tripData);
  return response.data;
};

export const deleteTrip = async (id: string, agentOtp?: string): Promise<{ success: boolean; message: string; code?: string }> => {
  const response = await api.delete(`/agent/trip/${id}`, { data: { agentOtp } });
  return response.data;
};

export const publishTrip = async (id: string): Promise<{ success: boolean; message: string; trip: AgentTrip }> => {
  const response = await api.post("/agent/trips/publish", { id });
  return response.data;
};

export const saveDraft = async (id: string, tripData: Partial<AgentTrip>): Promise<{ success: boolean; trip: AgentTrip }> => {
  const response = await api.patch(`/agent/trips/${id}/draft`, tripData);
  return response.data;
};

export const requestCancellation = async (id: string): Promise<{ success: boolean; message: string; status: string }> => {
  const response = await api.patch(`/agent/trips/${id}/cancel-request`);
  return response.data;
};

// Master Data APIs
export const getMasterData = async (type: string): Promise<{ success: boolean; items: Array<{ _id: string; name: string }> }> => {
  const response = await api.get(`/master/${type}`);
  return response.data;
};

export const createMasterEntry = async (type: string, name: string): Promise<{ success: boolean; item: { _id: string; name: string } }> => {
  const response = await api.post(`/master/${type}`, { name });
  return response.data;
};

// Dashboard / Metrics API
export const getAgentMetrics = async (): Promise<{
  success: boolean;
  metrics: {
    publishedTrips: number;
    draftTrips: number;
    cancelledTrips: number;
    upcomingTrips: number;
    completedTrips: number;
    occupancy: number;
    revenue: number;
  };
}> => {
  const response = await api.get("/agent/metrics");
  return response.data;
};

export interface SlotResponse {
  success: boolean;
  tripSlots: number;
  usedSlots: number;
  bonusSlots: number;
  purchasedSlots?: number;
  baseSlots?: number;
  remainingSlots?: number;
  referralCode: string;
  referralCount: number;
}

export const getAgentSlots = async (): Promise<SlotResponse> => {
  const response = await api.get("/agent/slots");
  return response.data;
};

export const applyAgentReferral = async (referralCode: string): Promise<{ success: boolean; message: string; inviterName?: string }> => {
  const response = await api.post("/agent/apply-referral", { referralCode });
  return response.data;
};

export const getAgentReferralSettings = async (): Promise<{ success: boolean; settings: any }> => {
  const response = await api.get("/agent/referral-settings");
  return response.data;
};

export const createSlotOrder = async (slotsCount: number): Promise<{ success: boolean; orderId: string; amount: number; slotsGranted: number }> => {
  const response = await api.post("/payment/agent/create-slot-order", { slotsCount });
  return response.data;
};

export const verifySlotPurchase = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  slotsCount: number;
  amount: number;
}): Promise<{ success: boolean; message: string; purchasedSlots: number }> => {
  const response = await api.post("/payment/agent/verify-slot-purchase", payload);
  return response.data;
};
