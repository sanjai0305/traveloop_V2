import axios from "axios";

// Determine absolute API base URL
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const clean = envUrl.replace(/\/+$/, ""); // strip trailing slash
  return clean.endsWith("/api") ? clean : `${clean}/api`;
};

const baseURL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

// Request Interceptor: Attach token and normalize URL to prevent duplicate /api
apiClient.interceptors.request.use(
  (config) => {
    // 1. Normalize config.url so it never doubles /api against baseURL
    if (config.url) {
      let urlStr = config.url.trim();

      // If it contains duplicate /api/api, collapse it
      if (urlStr.includes("/api/api/")) {
        urlStr = urlStr.replace(/\/api\/+api(\/|$)/g, "/api$1");
      }

      // If it starts with /api/ or api/, strip it because baseURL already includes /api
      if (urlStr === "/api" || urlStr === "api") {
        urlStr = "/";
      } else if (urlStr.startsWith("/api/")) {
        urlStr = "/" + urlStr.slice(5).replace(/^\/+/, "");
      } else if (urlStr.startsWith("api/")) {
        urlStr = "/" + urlStr.slice(4).replace(/^\/+/, "");
      }

      config.url = urlStr;
    }

    // 2. Attach Authorization token
    const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 handling, retries, and errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // 1. Handle 401 Unauthorized (JWT expired / invalid)
    if (response && response.status === 401) {
      const urlStr = config.url || "";
      const isAuthRoute =
        urlStr.includes("/auth/login") ||
        urlStr.includes("/auth/register") ||
        urlStr.includes("/auth/google") ||
        urlStr.includes("/auth/send-otp") ||
        urlStr.includes("/auth/verify-otp") ||
        urlStr.includes("/auth/forgot-password");

      if (!isAuthRoute) {
        const protectedPaths = [
          "/dashboard",
          "/my-trips",
          "/create-trip",
          "/build-itinerary",
          "/packing-checklist",
          "/trip-notes",
          "/activities",
          "/profile",
          "/trip-budget",
          "/saved-destinations",
        ];

        const currentPath = window.location.pathname;
        if (protectedPaths.some((p) => currentPath.startsWith(p))) {
          console.warn("[API Client] JWT expired/invalid (401). Dispatching auth:expired.");
          window.dispatchEvent(new CustomEvent("auth:expired"));
        }
      }
    }

    // 2. Retry Logic for 5xx Server Errors or Timeout/Network Errors
    const MAX_RETRIES = 2;
    config.__retryCount = config.__retryCount || 0;

    const isNetworkOrServerError =
      !response || 
      (response.status >= 500) || 
      error.code === "ECONNABORTED" || 
      error.message.includes("Network Error");

    if (isNetworkOrServerError && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      const delay = 1000 * Math.pow(2, config.__retryCount - 1);
      console.warn(`[API Client] Temporary connection error. Retry ${config.__retryCount}/${MAX_RETRIES} in ${delay}ms...`);
      
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    // 3. Normalize Error Message for UI consumption
    let userMessage = "Something went wrong. Please try again.";
    if (error.code === "ECONNABORTED" || error.message.includes("Network Error") || !response) {
      userMessage = "Unable to connect. Please try again later.";
    } else if (response && response.data && response.data.message) {
      const msg = response.data.message;
      if (
        msg.toLowerCase().includes("database") || 
        msg.toLowerCase().includes("mongoose") || 
        msg.toLowerCase().includes("mongo") || 
        msg.toLowerCase().includes("internal server error") || 
        msg.toLowerCase().includes("stack") ||
        msg.toLowerCase().includes("cast to objectid") ||
        response.status >= 500
      ) {
        userMessage = "Something went wrong. Please try again.";
      } else {
        userMessage = msg;
      }
    }

    error.userMessage = userMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
