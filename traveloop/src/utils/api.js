// src/utils/api.js

import { Capacitor } from "@capacitor/core";
import { apiClient } from "./apiClient";

const isNative = Capacitor.isNativePlatform();

// ─── API BASE URL ─────────────────────────────────────────────────────────────
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || "https://traveloopv2.duckdns.org";
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, ""); // strip trailing slash
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }

  if (isNative && import.meta.env.DEV) {
    return "http://10.0.2.2:5000/api";
  }

  return "/api";
};

const API_BASE_URL = getApiBaseUrl();

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// WebSocket base URL (strips /api suffix for socket.io)
export const getSocketUrl = () => {
  const base = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;
  return base || "http://localhost:5000";
};


// ─── GLOBAL FETCH INTERCEPTOR (BRIDGED TO AXIOS CLIENT) ────────────────────────
// This monkeypatches window.fetch so that all existing fetch calls automatically
// execute through our central Axios client instance.

const originalFetch = window.fetch;

window.fetch = async function (url, options = {}) {
  const urlStr = typeof url === "string" ? url : (url instanceof Request ? url.url : "");

  // If the request targets a Vercel system route, do not intercept it
  if (urlStr.includes(".well-known/vercel") || urlStr.includes("_vercel")) {
    return originalFetch.apply(this, arguments);
  }

  // If the request targets our backend API, route it through Axios
  if (urlStr.startsWith(API_BASE_URL) || urlStr.startsWith("/api") || !urlStr.startsWith("http")) {
    let relativePath = urlStr;
    if (urlStr.startsWith(API_BASE_URL)) {
      relativePath = urlStr.slice(API_BASE_URL.length);
    } else if (urlStr.startsWith("/api")) {
      relativePath = urlStr.slice(4);
    }

    // Clean leading/trailing slashes
    relativePath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;

    const axiosConfig = {
      url: relativePath,
      method: options.method || "GET",
      headers: options.headers ? (options.headers instanceof Headers ? Object.fromEntries(options.headers.entries()) : options.headers) : {},
    };

    // Parse options body
    if (options.body) {
      if (typeof options.body === "string") {
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