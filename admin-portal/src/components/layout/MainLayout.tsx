import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  X
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
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
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
      name: "Agent Management",
      path: "/agents",
      icon: Users,
      roles: ["Super Admin", "Support Admin", "Operations Admin"],
    },
    {
      name: "Trip Management",
      path: "/trips",
      icon: Map,
      roles: ["Super Admin", "Operations Admin"],
    },
    {
      name: "Booking Ledger",
      path: "/bookings",
      icon: BookOpen,
      roles: ["Super Admin", "Finance Admin"],
    },
    {
      name: "Finance & Wallet",
      path: "/finance",
      icon: CircleDollarSign,
      roles: ["Super Admin", "Finance Admin"],
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      roles: ["Super Admin", "Finance Admin", "Support Admin", "Operations Admin"],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: "Portal Settings",
      path: "/settings",
      icon: Settings,
      roles: ["Super Admin", "Finance Admin", "Support Admin", "Operations Admin"],
    },
  ];

  const allowedNavItems = navItems.filter(
    (item) => !admin || item.roles.includes(admin.role)
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-poppins">Traveloop</h1>
            <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Admin Portal</p>
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
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-teal-500 text-slate-950 font-semibold shadow-lg shadow-teal-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-slate-950" : "text-slate-400 group-hover:text-teal-400"}`} />
                  <span className="text-sm">{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? "bg-slate-950 text-teal-400" : "bg-teal-500/10 text-teal-400"
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
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE MENU BUTTON ── */}
      <div className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <h1 className="text-md font-bold text-white">Traveloop</h1>
            <p className="text-[8px] text-teal-400 font-semibold uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex flex-col pt-16">
          <nav className="flex-1 px-6 py-6 space-y-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl ${
                    isActive ? "bg-teal-500 text-slate-950 font-semibold" : "text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400">
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
              className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-rose-400 rounded-xl"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </nav>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Environment:</span>
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[10px] font-semibold uppercase tracking-wider">
              Local Development
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* User Badge */}
            {admin && (
              <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-200">{admin.displayName}</p>
                  <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">
                    {admin.role}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-sm">
                  {admin.displayName[0]}
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
