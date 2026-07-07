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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
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
      <div className="min-h-screen text-white" style={{
        background: `
          radial-gradient(circle at top right, rgba(0,255,190,0.08), transparent 35%),
          radial-gradient(circle at bottom left, rgba(0,150,255,0.05), transparent 40%),
          linear-gradient(180deg, #05111E, #09192A, #0B2035)
        `
      }}>
        {/* SIDEBAR ON DESKTOP - Fixed position, pinned permanently */}
        <Sidebar
          links={links}
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          collapsed={false}
          onCollapseToggle={() => {}}
          onLogout={handleLogout}
          pinned={true}
        />

        {/* CONTENT VIEWPORT - Fluid with max-width 1600px */}
        <div className="flex-1 flex flex-col min-h-screen ml-sidebar-expanded">
          <Navbar
            brandName="Traveloop"
            userName="Traveler"
            onMenuToggle={null}
          />
          <main className="flex-1 px-4 py-6 lg:px-12 lg:pt-8 lg:pb-10 w-full max-w-[1600px] overflow-y-auto">
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

  // Tablet viewport layout
  if (isTablet) {
    return (
      <div className="min-h-screen text-white" style={{
        background: `
          radial-gradient(circle at top right, rgba(0,255,190,0.08), transparent 35%),
          radial-gradient(circle at bottom left, rgba(0,150,255,0.05), transparent 40%),
          linear-gradient(180deg, #05111E, #09192A, #0B2035)
        `
      }}>
        {/* SIDEBAR ON TABLET - collapsible */}
        <Sidebar
          links={links}
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          collapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />

        {/* CONTENT VIEWPORT */}
        <div className="flex-1 flex flex-col min-h-screen ml-sidebar-collapsed md:ml-sidebar-expanded transition-all duration-300">
          <Navbar
            brandName="Traveloop"
            userName="Traveler"
            onMenuToggle={null}
          />
          <main className="flex-1 px-6 py-6 w-full overflow-y-auto">
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