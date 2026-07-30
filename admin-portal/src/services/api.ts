import axios, { AxiosResponse } from "axios";
import { IS_DEMO, isDemoToken, getMockResponse } from "../lib/demoMode";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("admin_token");

    // In demo mode: intercept ALL requests and return mock data immediately,
    // preventing ANY network call to the backend.
    if (IS_DEMO || isDemoToken(token)) {
      const url = config.url || "";
      const method = config.method || "GET";
      const mock = getMockResponse(url, method);

      if (mock !== null) {
        console.info(`[DemoMode] Intercepted ${method.toUpperCase()} ${url} → returning mock response`);
        // Abort the real request by throwing a special cancel token
        const cancelSource = axios.CancelToken.source();
        config.cancelToken = cancelSource.token;
        cancelSource.cancel(JSON.stringify({ __demoMock: true, data: mock }));
        return config;
      }
    }

    // Production path: attach real Bearer token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(`[Admin API] No Bearer token found for ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Demo mode cancel → unwrap the mock payload as a successful response
    if (axios.isCancel(error)) {
      try {
        const payload = JSON.parse(error.message || "{}");
        if (payload.__demoMock) {
          // Reconstruct a valid AxiosResponse-like object
          const mockResponse: Partial<AxiosResponse> = {
            data: payload.data,
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          };
          return mockResponse;
        }
      } catch {
        // Not a demo mock cancel — fall through
      }
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401) {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("admin_token");

      // Never redirect to login if this is a demo session
      if (isDemoToken(token)) {
        console.info("[DemoMode] 401 on demo session — ignoring (no backend redirect)");
        return Promise.reject(error);
      }

      const isAuthRoute =
        requestUrl.includes("/admin/login") ||
        requestUrl.includes("/admin/verify-2fa");
      if (isAuthRoute) return Promise.reject(error);

      console.warn("[API] Admin unauthorized (401) — clearing session:", requestUrl);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin_profile");

      if (!window.location.pathname.startsWith("/login")) {
        window.history.pushState({}, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
