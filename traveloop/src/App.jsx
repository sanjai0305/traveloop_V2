import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ROUTES
import AppRoutes from "./routes/AppRoutes";

// GLOBAL STYLES
import "./styles/global.css";

// TOAST PROVIDER
import ToastProvider from "./components/mobile/MobileToast";

// AUTH PROVIDER
import { AuthProvider } from "./context/AuthContext";

// THEME PROVIDER
import { ThemeProvider } from "./context/ThemeContext";

// ERROR BOUNDARY & OFFLINE INDICATOR
import ErrorBoundary from "./components/common/ErrorBoundary";
import OfflineIndicator from "./components/common/OfflineIndicator";

// LOGO IMAGE
import logoImg from "./assets/logo.jpg";

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B1325]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        className="w-40 h-40 rounded-[36px] overflow-hidden shadow-[0_20px_50px_rgba(20,184,181,0.3)] p-1 bg-gradient-to-tr from-teal-500 via-cyan-400 to-sky-500"
      >
        <div className="w-full h-full rounded-[34px] overflow-hidden bg-white">
          <img
            src={logoImg}
            alt="Traveloop Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="mt-6 text-4xl font-black text-white tracking-tight"
        style={{
          background: "linear-gradient(to right, #2DD4BF, #06B6D4, #3B82F6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Traveloop
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-[4px]"
      >
        Plan • Explore • Experience
      </motion.p>
    </motion.div>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleFocusIn = (e) => {
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea") {
        const path = window.location.pathname;
        const formPaths = [
          "/create-trip",
          "/profile",
          "/build-itinerary",
          "/trip-budget",
          "/trip-notes",
          "/packing-checklist"
        ];
        const isFormScreen = formPaths.some(p => path.startsWith(p));
        if (isFormScreen) {
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
      }
    };
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AnimatePresence mode="wait">
              {showSplash && <SplashScreen />}
            </AnimatePresence>
            <OfflineIndicator />
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;