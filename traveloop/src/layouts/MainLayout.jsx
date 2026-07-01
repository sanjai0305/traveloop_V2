// src/layouts/MainLayout.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Map, PlusCircle, Compass, User } from "lucide-react";

import MobileAppBar from "../components/mobile/MobileAppBar";
import BottomNavBar from "../components/mobile/BottomNavBar";

// Import shared navigation components
import Sidebar from "@shared-ui/navigation/Sidebar";
import Navbar from "@shared-ui/navigation/Navbar";
import ServerStatusIndicator from "../components/common/ServerStatusIndicator";

const pageVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const links = [
    { label: "Home", icon: <Home className="w-4 h-4" />, path: "/dashboard" },
    { label: "My Trips", icon: <Map className="w-4 h-4" />, path: "/my-trips" },
    { label: "Create Trip", icon: <PlusCircle className="w-4 h-4" />, path: "/create-trip" },
    { label: "Explore", icon: <Compass className="w-4 h-4" />, path: "/activities" },
    { label: "Profile", icon: <User className="w-4 h-4" />, path: "/profile" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">
        {/* SIDEBAR ON DESKTOP */}
        <Sidebar
          links={links}
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          collapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />

        {/* CONTENT VIEWPORT */}
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar
            brandName="Traveloop"
            userName="Traveler"
            onMenuToggle={null}
          />
          <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
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
          <ServerStatusIndicator />
        </div>
      </div>
    );
  }

  // Mobile viewport layout (falls back safely)
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* TOP BAR */}
      <MobileAppBar />

      {/* PAGE CONTENT */}
      <main
        className="flex-1 w-full max-w-lg mx-auto overflow-y-auto overflow-x-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              paddingBottom: "calc(var(--bottom-nav-height, 80px) + max(env(safe-area-inset-bottom), 12px) + 28px)",
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BOTTOM NAVIGATION */}
      <BottomNavBar />
      <ServerStatusIndicator />
    </div>
  );
};

export default MainLayout;