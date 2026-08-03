// src/layouts/MainLayout.jsx — Responsive App Layout with Full-Height Workspace & Dynamic Footer Support

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

const MainLayout = ({ children, hideFooter = false, noPadding = false }) => {
  const location = useLocation();

  // Automatically detect full-height SaaS workspace routes like Trip Chat
  const isChatPage = location.pathname.includes("/chat") || hideFooter;

  return (
    <div className={`min-h-screen flex flex-col bg-[#F7FAFC] text-[#0F172A] selection:bg-cyan-500 selection:text-white transition-colors duration-200 relative font-sans ${isChatPage ? "h-screen overflow-hidden" : "overflow-x-hidden"}`}>
      {/* Soft Ambient Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-400/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-blue-500/6 rounded-full blur-[160px]" />
      </div>

      {/* STICKY FLOATING NAVBAR (82px Height) */}
      <ResponsiveNavbar />

      {/* MAIN CONTENT AREA */}
      {isChatPage ? (
        <main className="flex-1 w-full z-10 relative overflow-hidden h-[calc(100vh-82px)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 z-10 relative">
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
      )}

      {/* GLOBAL FOOTER (Excluded on Chat Workspace) */}
      {!isChatPage && <ResponsiveFooter />}
    </div>
  );
};

export default MainLayout;