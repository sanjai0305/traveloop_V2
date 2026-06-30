import api from "../../../services/api";
import { Agent } from "../../../types";

export const getAgentProfile = async (): Promise<{ success: boolean; agent: Agent }> => {
  const response = await api.get("/agent/profile");
  return response.data;
};

export const updateAgentProfile = async (
  profileData: Partial<Agent>
): Promise<{ success: boolean; agent: Agent }> => {
  const response = await api.put("/agent/profile", profileData);
  return response.data;
};

export const submitOnboardingProfile = async (
  profileData: Partial<Agent>
): Promise<{ success: boolean; agent: Agent }> => {
  return await updateAgentProfile({
    ...profileData,
    profileCompleted: true,
  });
};
