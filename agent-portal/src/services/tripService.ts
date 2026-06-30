import api from "./api";
import { AgentTrip } from "../types";

/**
 * All agent trip routes are under /api/agent/trips/...
 * (mounted in agentRoutes.js at /api/agent)
 *
 * DO NOT use /api/trips/... — that is the Traveloop user trip route
 * which uses User auth middleware and will return 401 for agents.
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

export const deleteTrip = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/agent/trip/${id}`);
  return response.data;
};

export const publishTrip = async (id: string): Promise<{ success: boolean; message: string; trip: AgentTrip }> => {
  const response = await api.put(`/agent/trip/${id}/publish`);
  return response.data;
};
