// src/utils/api.js

import { apiClient } from "./apiClient";

const isNative = false;

// ─── API BASE URL ─────────────────────────────────────────────────────────────
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  if (envUrl && typeof envUrl === "string") {
    const clean = envUrl.trim().replace(/\/+$/, ""); // strip trailing slash
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }

  if (isNative && import.meta.env.DEV) {
    return "http://10.0.2.2:5000/api";
  }

  return "http://localhost:5000/api";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Constructs an absolute API URL with exactly one `/api` prefix.
 * Handles paths with or without leading slashes and with or without an existing 'api/' prefix.
 *
 * @param {string} path - Target path e.g. "upload", "/upload", "/api/upload", "payment/create-order"
 * @returns {string} Fully-qualified API URL
 */
export const getApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  if (typeof path !== "string") return API_BASE_URL;

  // If already an absolute http/https URL, collapse any accidental duplicate /api/api
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path.replace(/\/api\/+api(\/|$)/g, "/api$1");
  }

  // Strip leading slashes
  let cleanPath = path.trim().replace(/^\/+/, "");

  // If cleanPath begins with "api/", strip it because API_BASE_URL already includes "/api"
  if (cleanPath === "api") {
    cleanPath = "";
  } else if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.slice(4).replace(/^\/+/, "");
  }

  return cleanPath ? `${API_BASE_URL}/${cleanPath}` : API_BASE_URL;
};

/**
 * Returns the WebSocket base URL (strips `/api` suffix for Socket.IO origin).
 * Prioritizes VITE_SOCKET_URL if provided.
 */
export const getSocketUrl = () => {
  const socketEnv = import.meta.env.VITE_SOCKET_URL;
  if (socketEnv && typeof socketEnv === "string") {
    return socketEnv.trim().replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }

  const base = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;
  return base.replace(/\/+$/, "") || "http://localhost:5000";
};


// ─── GLOBAL FETCH INTERCEPTOR (BRIDGED TO AXIOS CLIENT) ────────────────────────
// Monkeypatches window.fetch so that existing fetch calls automatically
// execute through our central Axios client instance with unified baseURL, auth, and retries.

const originalFetch = window.fetch;

window.fetch = async function (url, options = {}) {
  const urlStr = typeof url === "string" ? url : (url instanceof Request ? url.url : "");

  // Bypass interceptor for external services and Vercel system paths
  if (
    urlStr.includes(".well-known/vercel") ||
    urlStr.includes("_vercel") ||
    urlStr.includes("maps.googleapis.com") ||
    urlStr.includes("checkout.razorpay.com")
  ) {
    return originalFetch.apply(this, arguments);
  }

  const baseOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  const isBackendRequest =
    urlStr.startsWith(API_BASE_URL) ||
    (baseOrigin && urlStr.startsWith(baseOrigin)) ||
    urlStr.startsWith("/api") ||
    !urlStr.startsWith("http");

  // If the request targets our backend API, route it through Axios
  if (isBackendRequest) {
    let relativePath = urlStr;
    if (urlStr.startsWith(API_BASE_URL)) {
      relativePath = urlStr.slice(API_BASE_URL.length);
    } else if (baseOrigin && urlStr.startsWith(baseOrigin)) {
      relativePath = urlStr.slice(baseOrigin.length);
    }

    // Clean leading slashes
    relativePath = relativePath.replace(/^\/+/, "");

    // If relativePath still begins with "api/", strip it to prevent duplicate /api with Axios baseURL
    if (relativePath === "api") {
      relativePath = "";
    } else if (relativePath.startsWith("api/")) {
      relativePath = relativePath.slice(4).replace(/^\/+/, "");
    }

    const headers = options.headers
      ? (options.headers instanceof Headers
          ? Object.fromEntries(options.headers.entries())
          : { ...options.headers })
      : {};

    const axiosConfig = {
      url: relativePath ? `/${relativePath}` : "/",
      method: options.method || "GET",
      headers,
    };

    // Handle body payload
    if (options.body) {
      if (options.body instanceof FormData) {
        axiosConfig.data = options.body;
        // Delete manual Content-Type header so browser/Axios assigns multipart boundary correctly
        delete axiosConfig.headers["Content-Type"];
        delete axiosConfig.headers["content-type"];
      } else if (typeof options.body === "string") {
        try {
          axiosConfig.data = JSON.parse(options.body);
        } catch (_) {
          axiosConfig.data = options.body;
        }
      } else {
        axiosConfig.data = options.body;
      }
    }

    try {
      const response = await apiClient.request(axiosConfig);

      // Return a mock Response object matching fetch API
      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
        json: async () => response.data,
        text: async () => typeof response.data === "string" ? response.data : JSON.stringify(response.data),
        blob: async () => new Blob([typeof response.data === "string" ? response.data : JSON.stringify(response.data)]),
      };
    } catch (err) {
      if (err.response) {
        // Axios error response (status code not 2xx)
        return {
          ok: false,
          status: err.response.status,
          statusText: err.response.statusText,
          headers: new Headers(err.response.headers),
          json: async () => err.response.data,
          text: async () => typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data),
          blob: async () => new Blob([typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data)]),
        };
      }
      // Connection errors / timeouts
      throw new Error(err.userMessage || err.message);
    }
  }

  // Fallback to native fetch for external URLs (maps, geocoders, etc.)
  return originalFetch(url, options);
};

export default API_BASE_URL;