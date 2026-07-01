import React, { useEffect, useState } from "react";
import { socket } from "../../utils/socket";
import { getApiUrl } from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";

const ServerStatusIndicator = () => {
  const [backendOnline, setBackendOnline] = useState(true);
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      // Hitting absolute root URL of backend (import.meta.env.VITE_API_URL/ or https://traveloopv2.duckdns.org/)
      const rootUrl = getApiUrl("").replace(/\/api\/?$/, "/");
      const res = await window.fetch(rootUrl, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setBackendOnline(data.success === true && data.db === "connected");
      } else {
        setBackendOnline(false);
      }
    } catch (_) {
      setBackendOnline(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    // Sync initial socket connection state
    setSocketConnected(socket.connected);

    // Socket.io connection status listeners
    const handleConnect = () => {
      console.log("[Status Indicator] Socket.io connected.");
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log("[Status Indicator] Socket.io disconnected.");
      setSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      clearInterval(interval);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const getStatusColor = () => {
    if (!backendOnline) return "bg-red-500 shadow-red-500/30";
    if (!socketConnected) return "bg-amber-500 shadow-amber-500/30";
    return "bg-emerald-500 shadow-emerald-500/30";
  };

  const getStatusText = () => {
    if (!backendOnline) return "🔴 Backend Offline";
    if (!socketConnected) return "⚡ Socket Disconnected";
    return "🟢 Backend Online";
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[9999] pointer-events-none font-poppins">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          onClick={() => setExpanded(!expanded)}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md cursor-pointer hover:bg-slate-900 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.4)] select-none"
        >
          {/* Pulsing Status Dot */}
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`}></span>
          </span>

          <span className="text-[10px] md:text-xs font-bold tracking-wide text-slate-300">
            {getStatusText()}
          </span>

          {expanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              className="flex items-center gap-3 pl-3 border-l border-slate-800 text-[10px] text-slate-400 font-semibold"
            >
              <span className="flex items-center gap-1.5">
                <span>API:</span>
                <span className={backendOnline ? "text-emerald-400" : "text-red-400"}>
                  {backendOnline ? "Online" : "Offline"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span>WS:</span>
                <span className={socketConnected ? "text-emerald-400" : "text-amber-400"}>
                  {socketConnected ? "Connected" : "Disconnected"}
                </span>
              </span>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ServerStatusIndicator;
