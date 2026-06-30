// src/components/mobile/MobileAppBar.jsx
// Contextual top bar — adapts per route with integrated Notification Drawer

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Bell, Search, MapPin, CheckCheck, Trash2,
  AlertTriangle, CheckCircle2, Info, CalendarDays, X
} from "lucide-react";
import { motion } from "framer-motion";
import { getApiUrl } from "../../utils/api";
import BottomSheet from "./BottomSheet";

import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";

const ROUTE_META = {
  "/dashboard":        { title: null,               showLocation: true  },
  "/my-trips":         { title: "My Trips",          showBack: false     },
  "/create-trip":      { title: "Plan a Trip",       showBack: true      },
  "/profile":          { title: "Profile",           showBack: false     },
  "/admin":            { title: "Admin",             showBack: false     },
  "/saved-destinations": { title: "Saved Places",     showBack: true      },
};

const getRouteMeta = (pathname) => {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  if (pathname.startsWith("/build-itinerary"))   return { title: "Itinerary",        showBack: true };
  if (pathname.startsWith("/packing-checklist")) return { title: "Packing Checklist", showBack: true };
  if (pathname.startsWith("/trip-notes"))        return { title: "Trip Notes",        showBack: true };
  if (pathname.startsWith("/activities"))        return { title: "Activities",        showBack: true };
  if (pathname.startsWith("/trip-budget"))       return { title: "Trip Budget",       showBack: true };
  return { title: "Traveloop", showBack: false };
};

const formatTime = (dateStr) => {
  try {
    const diff = new Date() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch (_) {
    return "";
  }
};

const MobileAppBar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const meta      = getRouteMeta(location.pathname);
  const isDash    = location.pathname === "/dashboard";

  const [notifications, setNotifications] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { user, refreshUserData } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const initial = currentUser?.firstName?.[0]?.toUpperCase() || "T";

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(getApiUrl("notifications"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    const original = [...notifications];
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, read: true } : n))
    );
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`notifications/${id}/read`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        setNotifications(original);
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
      setNotifications(original);
    }
  };

  const handleMarkAllAsRead = async () => {
    const original = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("notifications/read-all"), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        setNotifications(original);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
      setNotifications(original);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const original = [...notifications];
    setNotifications(prev => prev.filter(n => n._id !== id));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`notifications/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        setNotifications(original);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      setNotifications(original);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    const original = [...notifications];
    setNotifications([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("notifications/clear-all"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        setNotifications(original);
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
      setNotifications(original);
    }
  };

  const handleAcceptInvite = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/invite/${notificationId}/accept`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await fetchNotifications();
        if (refreshUserData) {
          await refreshUserData();
        }
        window.dispatchEvent(new CustomEvent("refreshTrips"));
      } else {
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
      await fetchNotifications();
    }
  };

  const handleDeclineInvite = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/invite/${notificationId}/decline`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await fetchNotifications();
        if (refreshUserData) {
          await refreshUserData();
        }
        window.dispatchEvent(new CustomEvent("refreshTrips"));
      } else {
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      await fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "warning":
        return { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" };
      case "trip":
        return { icon: CalendarDays, color: "text-teal-500", bg: "bg-teal-50" };
      case "success":
        return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" };
      default:
        return { icon: Info, color: "text-slate-500", bg: "bg-slate-50" };
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 w-full glass border-b border-white/60"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
      >
        <div
          className="flex items-center justify-between h-[60px] px-4 max-w-lg mx-auto"
        >
          {/* ── LEFT ── */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {meta.showBack ? (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft size={19} className="text-slate-700" />
              </motion.button>
            ) : isDash ? (
              /* Dashboard: Avatar */
              <Avatar user={currentUser} size={36} onClick={() => navigate("/profile")} />
            ) : null}

            {/* Center: Location chip (dashboard) or Title */}
            {isDash ? (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-sm font-medium"
              >
                <MapPin size={12} className="text-teal-500 flex-shrink-0" />
                <span className="truncate max-w-[140px]">{currentUser?.city || "Traveler"}</span>
              </button>
            ) : (
              <h1 className="text-[17px] font-bold text-slate-800 tracking-tight truncate">
                {meta.title}
              </h1>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isDash && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate("/my-trips")}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 border border-slate-100"
                aria-label="Search"
              >
                <Search size={16} className="text-slate-600" />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                setDrawerOpen(true);
                fetchNotifications(); // Refresh on open
              }}
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 border border-slate-100"
              aria-label="Notifications"
            >
              <Bell size={16} className="text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── NOTIFICATION DRAWER ── */}
      <BottomSheet
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Notifications"
        snapPoints={["80vh"]}
      >
        <div className="flex flex-col h-full">
          {/* Action Row */}
          {notifications.length > 0 && (
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-bold text-teal-600 active:scale-95 transition-transform"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-500 active:scale-95 transition-transform"
              >
                <Trash2 size={13} /> Clear all
              </button>
            </div>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <div className="w-16 h-16 rounded-[22px] bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-slate-400">
                  <Bell size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">🔔 You're all caught up!</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 max-w-[200px]">No notifications yet.</p>
                </div>
              </div>
            ) : (
              notifications.map(n => {
                const config = getNotificationIcon(n.type);
                const Icon = config.icon;
                return (
                  <div
                    key={n._id}
                    onClick={() => {
                      if (!n.read) handleMarkAsRead(n._id);
                      if (n.type === "chat" && n.trip) {
                        setDrawerOpen(false);
                        navigate(`/build-itinerary/${n.trip._id || n.trip}?openChat=true`);
                      }
                    }}
                    className={`p-3.5 rounded-[20px] border flex gap-3 cursor-pointer transition-all duration-200 relative ${
                      n.read ? "bg-white border-slate-100 opacity-75" : "bg-slate-50/50 border-slate-150 shadow-xs"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!n.read && (
                      <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-teal-500" />
                    )}

                    {/* Icon Block */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                      <Icon size={16} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs font-extrabold text-slate-800 leading-snug">{n.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{n.message}</p>
                      
                      {n.isInvite && n.inviteStatus === "pending" && (
                        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleAcceptInvite(n._id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-500 text-white font-bold text-[10px] uppercase tracking-wide active:scale-95 transition-transform"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineInvite(n._id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wide active:scale-95 transition-transform"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      
                      {n.isInvite && n.inviteStatus === "accepted" && (
                        <span className="text-[10px] text-emerald-500 font-bold block mt-2">✓ Accepted</span>
                      )}

                      {n.isInvite && n.inviteStatus === "declined" && (
                        <span className="text-[10px] text-rose-500 font-bold block mt-2">✗ Declined</span>
                      )}

                      <span className="text-[9px] text-slate-400 font-bold block mt-1.5">{formatTime(n.createdAt)}</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(n._id, e)}
                      className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex-shrink-0 self-start transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default MobileAppBar;
