import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import {
  LayoutDashboard,
  Users,
  Map,
  BookOpen,
  CircleDollarSign,
  Bell,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Gift
} from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification counts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/admin/notifications");
        if (res.data.success) {
          const unread = res.data.notifications.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.warn("Failed to load notifications count", err);
      }
    };
    fetchNotifications();

    // 1. Slow polling fallback (30 seconds)
    const interval = setInterval(fetchNotifications, 30000);

    // 2. Real-time Socket.io listener
    let socket: any = null;
    try {
      const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL;
      const socketUrl = envUrl ? envUrl.replace(/\/+$/, "").replace(/\/api$/, "") : "https://traveloopv2.duckdns.org";
      
      socket = io(socketUrl, {
        transports: ["websocket"],
        autoConnect: true
      });

      socket.on("connect", () => {
        console.log("[Socket.io] Admin MainLayout connected:", socket.id);
      });

      socket.on("adminNotification", () => {
        console.log("[Socket.io] Realtime notification received. Refreshing count...");
        fetchNotifications();
      });
    } catch (socketErr) {
      console.warn("[Socket.io] Error initializing socket in MainLayout:", socketErr);
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Super Admin", "Finance Admin", "Support Admin", "Operations Admin"],
    },
    {
      name: "Trips",
      path: "/trips",
      icon: Map,
      roles: ["Super Admin", "Operations Admin"],
    },
    {
      name: "Bookings",
      path: "/bookings",
      icon: BookOpen,
      roles: ["Super Admin", "Finance Admin"],
    },
    {
      name: "Wallet",
      path: "/finance",
      icon: CircleDollarSign,
      roles: ["Super Admin", "Finance Admin"],
    },
    {
      name: "Users",
      path: "/agents",
      icon: Users,
      roles: ["Super Admin", "Support Admin", "Operations Admin"],
    },
    {
      name: "Referrals",
      path: "/referrals",
      icon: Gift,
      roles: ["Super Admin", "Finance Admin", "Support Admin", "Operations Admin"],
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      roles: ["Super Admin", "Finance Admin", "Support Admin", "Operations Admin"],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["Super Admin", "Finance Admin", "Support Admin", "Operations Admin"],
    },
  ];

  const allowedNavItems = navItems.filter(
    (item) => !admin || item.roles.includes(admin.role)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-800">
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-[#E5E7EB] shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center shadow-lg shadow-teal-500/10">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800 font-poppins">Traveloop</h1>
            <p className="text-[9px] text-[#14B8A6] font-extrabold uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-[#14B8A6]/10 text-[#14B8A6] font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#14B8A6]" : "text-slate-400 group-hover:text-[#14B8A6]"}`} />
                  <span className="text-xs font-bold">{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive ? "bg-[#14B8A6] text-white" : "bg-[#14B8A6]/15 text-[#14B8A6]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:text-red-500 rounded-xl hover:bg-red-50/50 transition-all duration-250"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
            <span className="text-xs font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE MENU BUTTON ── */}
      <div className="md:hidden h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#14B8A6] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-805">Traveloop</h1>
            <p className="text-[8px] text-[#14B8A6] font-bold uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-500 hover:text-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#F8FAFC] z-40 flex flex-col pt-16 animate-fade-in">
          <nav className="flex-1 px-6 py-6 space-y-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                    isActive ? "bg-[#14B8A6]/10 text-[#14B8A6] font-bold" : "text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold font-medium">Sign Out</span>
            </button>
          </nav>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Environment:</span>
            <span className="px-2 py-0.5 rounded bg-[#14B8A6]/10 text-[#14B8A6] text-[9px] font-black uppercase tracking-wider">
              Local Development
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* User Badge */}
            {admin && (
              <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{admin.displayName}</p>
                  <p className="text-[9px] text-[#14B8A6] font-extrabold uppercase tracking-widest mt-0.5">
                    {admin.role}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center font-black text-[#14B8A6] text-xs">
                  {admin.displayName[0].toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic page container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
export default MainLayout;
