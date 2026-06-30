// src/utils/api.js

import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

// ─── API BASE URL ─────────────────────────────────────────────────────────────
// Single source of truth. Priority order:
//   1. VITE_API_URL env variable (set in .env or .env.production)
//   2. Production Vercel backend (hardcoded safety fallback)
//
// In DEV mode with no VITE_API_URL, we default to PRODUCTION so the frontend
// always talks to the live backend — never accidentally to a missing localhost.
// Set VITE_API_URL=http://localhost:5000 in .env ONLY when running the backend locally.

const PRODUCTION_API = "http://65.2.84.40:5000/api";

const getApiBaseUrl = () => {
  // 1. Explicit env var always wins (development or production)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, ""); // strip trailing slash
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }

  // 2. Native Android emulator in local dev (only if explicitly in dev mode)
  if (isNative && import.meta.env.DEV) {
    return "http://10.0.2.2:5000/api";
  }

  // 3. Default: deployed production backend
  return PRODUCTION_API;
};

const API_BASE_URL = getApiBaseUrl();

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// ─── GLOBAL FETCH INTERCEPTOR ────────────────────────────────────────────────
// Handles: offline guard, 15-second timeout, JWT expiry detection,
// 5xx retry (max 2 attempts). Does NOT retry connection errors to prevent
// console flooding with ERR_CONNECTION_REFUSED.

const originalFetch = window.fetch;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_SERVER_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;

window.fetch = async function (url, options = {}) {
  // ── OFFLINE GUARD ──────────────────────────────────────────────────────────
  if (!navigator.onLine) {
    const method = (options.method || "GET").toUpperCase();
    if (method === "POST" || method === "PUT" || method === "DELETE") {
      const msg =
        "You are offline. Please check your internet connection and try again.";
      alert(msg);
      throw new Error(msg);
    }
  }

  const executeFetch = async (attempt) => {
    // ── TIMEOUT ────────────────────────────────────────────────────────────
    let timeoutId = null;
    let abortController = null;

    // Only create our own abort controller if the caller didn't pass one
    if (!options.signal) {
      abortController = new AbortController();
      timeoutId = setTimeout(
        () => abortController.abort(),
        REQUEST_TIMEOUT_MS
      );
    }

    const fetchOptions = abortController
      ? { ...options, signal: abortController.signal }
      : options;

    try {
      // ── DETECT CORRUPTED TOKENS ───────────────────────────────────────────
      // If the page is incorrectly sending a literal "null" or "undefined", strip it out.
      let authHeader = null;
      if (fetchOptions.headers) {
        if (fetchOptions.headers instanceof Headers) {
          authHeader = fetchOptions.headers.get("Authorization");
        } else if (!Array.isArray(fetchOptions.headers)) {
          authHeader = fetchOptions.headers["Authorization"] || fetchOptions.headers["authorization"];
        }
      }

      if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const tokenPart = authHeader.split(" ")[1];
        if (!tokenPart || tokenPart === "null" || tokenPart === "undefined" || tokenPart === "NaN" || tokenPart === "[object Object]" || tokenPart.split('.').length !== 3) {
          console.error(`[API] 🛑 Prevented sending corrupted/invalid Authorization header: "Bearer ${tokenPart}"`);
          
          // Strip it
          if (fetchOptions.headers instanceof Headers) {
            fetchOptions.headers.delete("Authorization");
          } else {
            delete fetchOptions.headers["Authorization"];
            delete fetchOptions.headers["authorization"];
          }
          
          // Dispatch auth:expired to force logout since token is clearly corrupted
          window.dispatchEvent(new CustomEvent("auth:expired"));
        } else {
          console.log(`[API] 🔐 Sending Authorization: Bearer ${tokenPart.substring(0, 5)}... (Length: ${tokenPart.length})`);
        }
      }

      // Clone Request objects so we can re-use them on retry
      const requestParam = url instanceof Request ? url.clone() : url;
      const response = await originalFetch(requestParam, fetchOptions);

      if (timeoutId) clearTimeout(timeoutId);

      // ── JWT EXPIRATION (401) ─────────────────────────────────────────────
      if (response.status === 401) {
        const urlStr =
          typeof url === "string"
            ? url
            : url instanceof Request
            ? url.url
            : "";

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
            console.warn(
              "[API] JWT expired or invalid (401). Dispatching auth:expired."
            );
            window.dispatchEvent(new CustomEvent("auth:expired"));
          }
        }
      }

      // ── RETRY ON 5xx SERVER ERRORS ONLY ─────────────────────────────────
      if (
        !response.ok &&
        response.status >= 500 &&
        attempt < MAX_SERVER_RETRIES
      ) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[API] Server error ${response.status}. Retry ${attempt + 1}/${MAX_SERVER_RETRIES} in ${delay}ms…`
        );
        await new Promise((r) => setTimeout(r, delay));
        return executeFetch(attempt + 1);
      }

      return response;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);

      // ── TIMEOUT ──────────────────────────────────────────────────────────
      if (err.name === "AbortError") {
        console.error(
          `[API] Request timed out (${REQUEST_TIMEOUT_MS / 1000}s): ${url}`
        );
        throw new Error(
          "Request timed out. Please check your internet connection and try again."
        );
      }

      // ── CONNECTION REFUSED / NETWORK ERROR — no automatic retry ──────────
      // Retrying a connection that is refused floods the console and gives no
      // benefit. Surface a clear message immediately.
      const msg = err.message || "";
      const isConnectionError =
        msg.includes("Failed to fetch") ||
        msg.includes("ERR_CONNECTION_REFUSED") ||
        msg.includes("NetworkError") ||
        msg.includes("net::ERR") ||
        msg.includes("Load failed");

      if (isConnectionError) {
        console.error(`[API] Connection error for ${url}:`, msg);
        throw new Error(
          "Unable to connect to the server. Please check your internet connection."
        );
      }

      // ── OTHER ERRORS — retry up to MAX_SERVER_RETRIES ───────────────────
      if (attempt < MAX_SERVER_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[API] Fetch error (${msg}). Retry ${attempt + 1}/${MAX_SERVER_RETRIES} in ${delay}ms…`
        );
        await new Promise((r) => setTimeout(r, delay));
        return executeFetch(attempt + 1);
      }

      throw err;
    }
  };

  return executeFetch(0);
};

export default API_BASE_URL;