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
  validateSession: () => Promise<void>;
}

/**
 * Zustand auth store.
 * – Initializes synchronously from localStorage so there is NO async flash.
 * – validateSession() is called on app mount to verify the stored token
 *   against the backend /api/agent/me endpoint.
 * – isLoading is false initially (sync read) but becomes true during the
 *   async token validation phase to prevent protected routes from flashing.
 */
export const useAuthStore = create<AuthState>((set, get) => {
  // ── Restore session synchronously on module load ──────────────────────
  const savedToken = localStorage.getItem("agentToken");
  const savedAgent = localStorage.getItem("agentUser");

  console.log("[AgentAuth] Restoring session from localStorage...");
  console.log("[AgentAuth] Agent Token:", savedToken ? `${savedToken.slice(0, 20)}...` : null);

  let parsedAgent: Agent | null = null;
  if (savedAgent) {
    try {
      parsedAgent = JSON.parse(savedAgent);
    } catch {
      // corrupted — ignore and treat as logged-out
      localStorage.removeItem("agentUser");
    }
  }

  const hasValidSession = !!savedToken && !!parsedAgent;

  return {
    token: savedToken,
    agent: parsedAgent,
    isAuthenticated: hasValidSession,
    // If we have a saved token, mark loading=true until backend validates it
    isLoading: !!savedToken,

    setAuth: (token, agent) => {
      console.log("[AgentAuth] setAuth called — persisting token & profile to localStorage");
      console.log("[AgentAuth] Token:", `${token.slice(0, 20)}...`);
      localStorage.setItem("agentToken", token);
      localStorage.setItem("agentUser", JSON.stringify(agent));
      set({ token, agent, isAuthenticated: true, isLoading: false });
    },

    updateAgent: (agent) => {
      localStorage.setItem("agentUser", JSON.stringify(agent));
      set({ agent });
    },

    logout: () => {
      console.log("[AgentAuth] logout called — clearing localStorage");
      localStorage.removeItem("agentToken");
      localStorage.removeItem("agentUser");
      set({ token: null, agent: null, isAuthenticated: false, isLoading: false });
    },

    setLoading: (loading) => set({ isLoading: loading }),

    /**
     * validateSession — called once on app mount.
     * Pings /api/agent/me with the stored token.
     * If valid: refresh agent data from server.
     * If invalid / expired: clear session and redirect to /login.
     */
    validateSession: async () => {
      const token = localStorage.getItem("agentToken");
      console.log("[AgentAuth] validateSession — stored token:", token ? `${token.slice(0, 20)}...` : "none");

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      try {
        // Lazy import to avoid circular dependency
        const axiosModule = await import("../services/api");
        const api = axiosModule.default;

        console.log("[AgentAuth] Calling /agent/me to validate token...");
        const response = await api.get("/agent/me");

        if (response.data?.success && response.data?.agent) {
          const freshAgent = response.data.agent;
          console.log("[AgentAuth] Token valid — refreshed agent profile from server");
          localStorage.setItem("agentUser", JSON.stringify(freshAgent));
          set({ agent: freshAgent, isAuthenticated: true, isLoading: false });
        } else {
          throw new Error("Invalid response from /agent/me");
        }
      } catch (err) {
        console.warn("[AgentAuth] Token validation failed — clearing session", err);
        localStorage.removeItem("agentToken");
        localStorage.removeItem("agentUser");
        set({ token: null, agent: null, isAuthenticated: false, isLoading: false });
      }
    },
  };
});

