// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

// Validate Environment Loading
console.log("=== [Traveloop Env Validation] ===");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("Firebase Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("App Mode:", import.meta.env.MODE);
if (!import.meta.env.VITE_API_URL) {
  console.warn("⚠️ VITE_API_URL is not set! API calls may fall back to root.");
}
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.error("❌ VITE_FIREBASE_API_KEY is not defined! Auth services will fail.");
}
console.log("==================================");

// Global broken image fallback listener (capture phase)
window.addEventListener(
  "error",
  (e) => {
    const target = e.target;
    if (target && target.tagName === "IMG") {
      target.src = "/placeholder.jpg";
    }
  },
  true
);

// MAIN APP
import App from "./App";

// TAILWIND CSS
import "./index.css";

// i18n TRANSLATIONS
import "./i18n/i18n";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);