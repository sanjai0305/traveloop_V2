// src/components/common/ResponsiveNavbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell, Sun, Moon, Menu, X, ChevronDown, LogOut, User,
  MapPin, CheckCheck, Trash2, AlertTriangle, CheckCircle2,
  Info, CalendarDays, Compass, Map, Home, PlusCircle, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl } from "../../utils/api";
import socket from "../../utils/socket";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Avatar from "./Avatar";

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

const getNotificationIcon = (type) => {
  switch (type) {
    case "warning":
      return { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" };
    case "trip":
      return { icon: CalendarDays, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" };
    case "success":
      return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" };
    default:
      return { icon: Info, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-900/30" };
  }
};

const ResponsiveNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUserData } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    if (user?.id || user?._id) {
      socket.emit("join_user_room", user.id || user._id);
    }

    const handlePush = (notification) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
    };
    socket.on("notification", handlePush);

    return () => {
      socket.off("notification", handlePush);
    };
  }, [user]);

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
      if (!data.success) setNotifications(original);
    } catch (err) {
      console.error("Error marking read:", err);
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
      if (!data.success) setNotifications(original);
    } catch (err) {
      console.error("Error marking all read:", err);
      setNotifications(original);
    }
  };

  const handleDeleteNotif = async (id, e) => {
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
      if (!data.success) setNotifications(original);
    } catch (err) {
      console.error("Error deleting notification:", err);
      setNotifications(original);
    }
  };

  const handleClearAllNotifs = async () => {
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
      if (!data.success) setNotifications(original);
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
        if (refreshUserData) await refreshUserData();
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
        if (refreshUserData) await refreshUserData();
        window.dispatchEvent(new CustomEvent("refreshTrips"));
      } else {
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      await fetchNotifications();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const userFullName = user ? `${user.firstName} ${user.lastName || ""}` : "Traveler";

  const navLinks = [
    { label: "Home", path: "/dashboard", icon: <Home size={16} /> },
    { label: "My Trips", path: "/my-trips", icon: <Map size={16} /> },
    { label: "Create Trip", path: "/create-trip", icon: <PlusCircle size={16} /> },
    { label: "Explore", path: "/activities", icon: <Compass size={16} /> },
  ];

  if (user?.role === "admin") {
    navLinks.push({ label: "Admin", path: "/admin", icon: <User size={16} /> });
  }

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-2 lg:top-3 z-50 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* 82px Height Floating Glass Container */}
      <div className="h-[82px] w-full rounded-2xl md:rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-950/[0.06] dark:border-white/[0.08] shadow-[0_10px_35px_rgba(15,23,42,0.06)] flex items-center justify-between px-6 transition-all duration-300">
        
        {/* LOGO & BRAND MARK */}
        <Link to="/dashboard" className="flex items-center gap-3 group text-decoration-none">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center font-black text-cyan-600 text-lg">
              ✈️
            </div>
          </div>
          <span className="font-poppins font-black text-2xl bg-gradient-to-r from-slate-900 via-cyan-600 to-blue-600 dark:from-white dark:to-cyan-400 bg-clip-text text-transparent tracking-tight">
            Traveloop
          </span>
        </Link>

        {/* DESKTOP NAV LINKS (Rounded Pill Active Design) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/60 dark:bg-slate-950/40 p-1.5 rounded-full border border-slate-200/40 dark:border-white/5">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-5 py-2.5 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center gap-2 ${
                  active
                    ? "bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 text-cyan-600 border border-cyan-200/60 shadow-sm dark:bg-slate-800 dark:text-cyan-400 dark:border-cyan-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white/60 dark:hover:bg-slate-800/50"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* CONTROLS (PILL THEME SWITCH, NOTIFICATION BELL, PROFILE AVATAR) */}
        <div className="flex items-center gap-3.5">
          
          {/* MODERN PILL DARK MODE SWITCH */}
          <button
            onClick={toggleTheme}
            className="relative w-14 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-1 transition-colors flex items-center cursor-pointer"
            aria-label="Toggle theme"
          >
            <motion.div
              animate={{ x: isDark ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-white flex items-center justify-center shadow-md"
            >
              {isDark ? <Moon size={12} /> : <Sun size={12} />}
            </motion.div>
          </button>

          {/* NOTIFICATION BELL WITH HOVER ANIMATION */}
          <div className="relative" ref={notifRef}>
            <motion.button
              whileHover={{ rotate: [0, -12, 12, -6, 6, 0], scale: 1.05 }}
              transition={{ duration: 0.4 }}
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
                if (!notifOpen) fetchNotifications();
              }}
              className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center justify-center relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse shadow-sm shadow-cyan-500/50">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* NOTIFICATIONS DROPDOWN */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-[360px] sm:w-[400px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden z-50 text-left"
                >
                  <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-150">Notifications</span>
                    {notifications.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-[11px] font-extrabold text-cyan-600 hover:underline"
                        >
                          <CheckCheck size={12} /> Mark read
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                          onClick={handleClearAllNotifs}
                          className="flex items-center gap-1 text-[11px] font-extrabold text-rose-500 hover:underline"
                        >
                          <Trash2 size={12} /> Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                    {notifications.length === 0 ? (
                      <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                          <Bell size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">You're all caught up!</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">No notifications yet.</p>
                        </div>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const iconConfig = getNotificationIcon(n.type);
                        const Icon = iconConfig.icon;
                        return (
                          <div
                            key={n._id}
                            onClick={() => {
                              if (!n.read) handleMarkAsRead(n._id);
                              if (n.type === "chat" && n.trip) {
                                setNotifOpen(false);
                                navigate(`/build-itinerary/${n.trip._id || n.trip}?openChat=true`);
                              }
                            }}
                            className={`p-3.5 flex gap-3 cursor-pointer transition-colors relative hover:bg-slate-50/50 dark:hover:bg-slate-850/30 ${
                              n.read ? "opacity-70" : "bg-cyan-500/[0.03]"
                            }`}
                          >
                            {!n.read && (
                              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-500" />
                            )}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconConfig.bg} ${iconConfig.color}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{n.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed mt-0.5">{n.message}</p>
                              
                              {n.isInvite && n.inviteStatus === "pending" && (
                                <div className="flex gap-2 mt-2.5" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleAcceptInvite(n._id)}
                                    className="px-2.5 py-1 rounded bg-cyan-500 text-white font-bold text-[9px] uppercase tracking-wide active:scale-95 transition-transform"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineInvite(n._id)}
                                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 font-bold text-[9px] uppercase tracking-wide active:scale-95 transition-transform border border-slate-200/40"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}

                              {n.isInvite && n.inviteStatus === "accepted" && (
                                <span className="text-[9px] text-emerald-500 font-bold block mt-1.5">✓ Accepted</span>
                              )}
                              {n.isInvite && n.inviteStatus === "declined" && (
                                <span className="text-[9px] text-rose-500 font-bold block mt-1.5">✗ Declined</span>
                              )}

                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">{formatTime(n.createdAt)}</span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotif(n._id, e)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 self-start transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* USER PROFILE AVATAR WITH GLOW RING */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-1 p-0.5 rounded-full ring-2 ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md shadow-cyan-500/20 hover:scale-105 transition-transform cursor-pointer"
              aria-label="User menu"
            >
              <Avatar user={user} size={32} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden z-50 text-left"
                >
                  <div className="px-4 py-3.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{userFullName}</span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">{user?.email || ""}</span>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                    >
                      <User size={14} /> Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            <nav className="p-4 flex flex-col gap-2">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                      active
                        ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-cyan-600"
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default ResponsiveNavbar;
