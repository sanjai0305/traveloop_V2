import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

console.log("=== [Agent Portal Env Validation] ===");
console.log("API URL", import.meta.env.VITE_API_URL);
console.log("Socket URL", import.meta.env.VITE_SOCKET_URL);
console.log("Mode", import.meta.env.MODE);
console.log("=====================================");

// Global broken image fallback listener (capture phase)
window.addEventListener(
  "error",
  (e) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === "IMG") {
      (target as HTMLImageElement).src = "/placeholder.jpg";
    }
  },
  true
);

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
