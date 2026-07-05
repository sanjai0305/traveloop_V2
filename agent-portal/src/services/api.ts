import axios from "axios";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }
  return "https://traveloopv2.duckdns.org/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach Bearer token ───────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("agentToken");
    console.log("[AgentAPI] Agent Token:", token ? `${token.slice(0, 20)}...` : null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[AgentAPI] Authorization Header: Bearer", `${token.slice(0, 20)}...`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: graceful 401 handling (NO hard page reload) ─────
//
// IMPORTANT: We do NOT logout on every 401.
// A 401 from /api/analytics or similar non-critical routes should not
// destroy the session. Only logout when the /api/agent/* auth routes
// themselves return 401 (i.e., the session token is truly invalid).
//
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401) {
      // Only logout if the failure is from a core agent auth route
      // OR if there is no token at all (unauthenticated request)
      const token = localStorage.getItem("agentToken");
      const isAuthRoute =
        requestUrl.includes("/agent/login") ||
        requestUrl.includes("/agent/me") ||
        requestUrl.includes("/agent/profile");

      const errCode = error.response?.data?.code;
      const errMsg = error.response?.data?.message || "";
      const isExplicitAuthFailure =
        errCode === "AGENT_NOT_FOUND" ||
        errCode === "USER_NOT_FOUND" ||
        errCode === "TOKEN_EXPIRED" ||
        errMsg.toLowerCase().includes("not authorized") ||
        errMsg.toLowerCase().includes("expired");

      if (!token || isAuthRoute || isExplicitAuthFailure) {
        console.warn(`[API] 401 auth failure (token missing/auth route/explicit code) — clearing session. URL: ${requestUrl}`);

        // Soft logout via Zustand store (lazy import to avoid circular deps)
        try {
          const { useAuthStore } = await import("../store/authStore");
          useAuthStore.getState().logout();
        } catch {
          // Fallback: clear localStorage manually
          localStorage.removeItem("agentToken");
          localStorage.removeItem("agentUser");
        }

        // Navigate without a hard reload
        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/signup")
        ) {
          window.history.pushState({}, "", "/login");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } else {
        // 401 on a non-critical route (e.g., analytics, bookings during session)
        // Log it but DO NOT logout — token may still be valid for other routes
        console.warn(`[API] 401 on non-critical route — ignoring to preserve session. URL: ${requestUrl}`);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
