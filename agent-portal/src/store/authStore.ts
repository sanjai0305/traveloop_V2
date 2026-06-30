import { create } from "zustand";
import { Agent } from "../types";

interface AuthState {
  token: string | null;
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;           // true while restoring session from localStorage
  setAuth: (token: string, agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand auth store.
 * – Initializes synchronously from localStorage so there is NO async flash.
 * – isLoading is false immediately (sync read), making it safe for ProtectedRoute.
 * – Exported as a singleton; api.ts can call useAuthStore.getState().logout()
 *   without React hooks to avoid circular-import issues.
 */
export const useAuthStore = create<AuthState>((set) => {
  // ── Restore session synchronously on module load ──────────────────────
  const savedToken = localStorage.getItem("agent_token");
  const savedAgent = localStorage.getItem("agent_profile");

  let parsedAgent: Agent | null = null;
  if (savedAgent) {
    try {
      parsedAgent = JSON.parse(savedAgent);
    } catch {
      // corrupted — ignore and treat as logged-out
      localStorage.removeItem("agent_profile");
    }
  }

  const hasValidSession = !!savedToken && !!parsedAgent;

  return {
    token: savedToken,
    agent: parsedAgent,
    isAuthenticated: hasValidSession,
    isLoading: false,           // synchronous restore — never need an async loading phase

    setAuth: (token, agent) => {
      localStorage.setItem("agent_token", token);
      localStorage.setItem("agent_profile", JSON.stringify(agent));
      set({ token, agent, isAuthenticated: true, isLoading: false });
    },

    updateAgent: (agent) => {
      localStorage.setItem("agent_profile", JSON.stringify(agent));
      set({ agent });
    },

    logout: () => {
      localStorage.removeItem("agent_token");
      localStorage.removeItem("agent_profile");
      set({ token: null, agent: null, isAuthenticated: false, isLoading: false });
    },

    setLoading: (loading) => set({ isLoading: loading }),
  };
});
