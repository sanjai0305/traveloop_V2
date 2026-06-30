// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

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