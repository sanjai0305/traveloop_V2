import { useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { getAgentProfile, updateAgentProfile, submitOnboardingProfile } from "../services/profile.service";

export const useAgentProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { agent, updateAgent } = useAuthStore();

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAgentProfile();
      if (res.success) {
        updateAgent(res.agent);
        return res.agent;
      }
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || "Failed to load profile details");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await updateAgentProfile(data);
      if (res.success) {
        updateAgent(res.agent);
        return res.agent;
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Failed to update profile";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await submitOnboardingProfile(data);
      if (res.success) {
        updateAgent(res.agent);
        return res.agent;
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Failed to submit onboarding profile";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    agent,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    completeOnboarding,
  };
};
