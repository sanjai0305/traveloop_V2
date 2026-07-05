import api from "./api";
import { Agent } from "../types";

export const signupAgent = async (formData: any): Promise<{ token: string; agent: Agent }> => {
  const response = await api.post("/agent/signup", formData);
  return response.data;
};

export const loginAgent = async (formData: any): Promise<{ token: string; agent: Agent }> => {
  const response = await api.post("/agent/login", formData);
  return response.data;
};

export const getAgentProfile = async (): Promise<{ agent: Agent }> => {
  const response = await api.get("/agent/profile");
  return response.data;
};

export const updateAgentProfile = async (formData: Partial<Agent>): Promise<{ agent: Agent }> => {
  const response = await api.put("/agent/profile/update", formData);
  return response.data;
};
