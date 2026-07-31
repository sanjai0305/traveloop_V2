// src/components/common/ResponsiveNavbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell, Sun, Moon, Menu, X, ChevronDown, LogOut, User,
  MapPin, CheckCheck, Trash2, AlertTriangle, CheckCircle2,
  Info, CalendarDays, Compass, Map, Home, PlusCircle
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
      return { icon: CalendarDays, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" };
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
  const logoInitial = user?.firstName?.[0]?.toUpperCase() || "T";
  const userFullName = user ? `${user.firstName} ${user.lastName || ""}` : "Traveler";

  const navLinks = [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "My Trips", path: "/my-trips", icon: <Map size={18} /> },
    { label: "Create Trip", path: "/create-trip", icon: <PlusCircle size={18} /> },
    { label: "Explore", path: "/activities", icon: <Compass size={18} /> },
  ];

  if (user?.role === "admin") {
    navLinks.push({ label: "Admin", path: "/admin", icon: <User size={18} /> });
  }

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/85 dark:border-slate-800/85 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* LOGO & BRAND */}
        <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-brand">
            <div className="w-full h-full rounded-[10px] overflow-hidden bg-white flex items-center justify-center font-bold text-teal-600">
              ✈️
            </div>
          </div>
          <span className="font-poppins font-black text-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent tracking-tight">
            Traveloop
          </span>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {link.label}
                {active && (
                  <motion.div
                    layoutId="navbar-active-dot"
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* CONTROLS (THEME, BELL, PROFILE) */}
        <div className="flex items-center gap-3">
          
          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* NOTIFICATION BELL */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
                if (!notifOpen) fetchNotifications();
              }}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-white dark:border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-[360px] sm:w-[400px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xl overflow-hidden z-50 text-left"
                >
                  <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-150">Notifications</span>
                    {notifications.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-[11px] font-extrabold text-teal-600 hover:underline"
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
                              n.read ? "opacity-70" : "bg-teal-500/[0.02]"
                            }`}
                          >
                            {!n.read && (
                              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-500" />
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
                                    className="px-2.5 py-1 rounded bg-teal-500 text-white font-bold text-[9px] uppercase tracking-wide active:scale-95 transition-transform"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineInvite(n._id)}
                                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-605 dark:text-slate-350 font-bold text-[9px] uppercase tracking-wide active:scale-95 transition-transform border border-slate-200/40"
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

          {/* USER AVATAR & DROPDOWN */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 transition-colors"
              aria-label="User menu"
            >
              <Avatar user={user} size={30} />
              <ChevronDown size={14} className="text-slate-400 dark:text-slate-550 pr-0.5" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden z-50 text-left"
                >
                  <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{userFullName}</span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">{user?.email || ""}</span>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-855 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      <User size={14} /> Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-colors"
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
            className="p-2 md:hidden rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-650 dark:text-slate-450 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
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
            className="md:hidden border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-950 overflow-hidden"
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
                        ? "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-teal-600"
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 dark:border-slate-850 my-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-505 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-colors"
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
