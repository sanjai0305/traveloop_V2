// src/layouts/MainLayout.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ResponsiveNavbar from "../components/common/ResponsiveNavbar";
import ResponsiveFooter from "../components/common/ResponsiveFooter";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

const MainLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200" style={{
      backgroundImage: `
        radial-gradient(circle at top right, rgba(20,184,181,0.04), transparent 45%),
        radial-gradient(circle at bottom left, rgba(0,150,255,0.02), transparent 45%)
      `
    }}>
      {/* STICKY HEADER & NAVBAR */}
      <ResponsiveNavbar />

      {/* FLUID MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <ResponsiveFooter />
    </div>
  );
};

export default MainLayout;