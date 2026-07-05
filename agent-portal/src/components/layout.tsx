import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  CalendarCheck2,
  Users,
  BarChart3,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Lock,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { agent, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // NOTE: Auth redirects are handled exclusively by ProtectedRoute.
  // Do NOT duplicate redirect logic here — it causes double-navigation bugs.

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("agent_theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("agent_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Trips", path: "/trips", icon: Compass },
    { label: "Bookings", path: "/bookings", icon: CalendarCheck2 },
    { label: "Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Wallet", path: "/wallet", icon: Wallet },
    { label: "Profile", path: "/profile", icon: User },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  // While restoring session, show a spinner (ProtectedRoute handles the redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isProfileLocked = !agent.profileCompleted;

  return (
    <div className="flex min-height-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 h-screen sticky top-0 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-brand">
            AP
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Agent Portal
            </h1>
            {isProfileLocked ? (
              <span className="text-[9px] bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-extrabold px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/50 mt-1.5 inline-block">
                Profile Incomplete
              </span>
            ) : (
              <span className="text-[10px] text-primary dark:text-primary-light font-bold uppercase tracking-wider">
                Traveloop branding
              </span>
            )}
          </div>
        </div>

        {/* Agency Summary */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 mb-6">
          {agent.logo ? (
            <img src={agent.logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
          ) : agent.companyName ? (
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              {agent.companyName[0]}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              A
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {agent.companyName || "New Agent"}
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold truncate block">
              {agent.email}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            // Profile-incomplete pages are still navigable — they show a banner inside.
            // Lock icon is decorative only.
            const showLockHint = isProfileLocked && ["Trips", "Bookings", "Customers", "Analytics"].includes(item.label);

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary dark:text-primary-light"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"}`} />
                {item.label}
                {showLockHint && (
                  <Lock className="w-3 h-3 ml-auto text-slate-300 dark:text-slate-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-1">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
          >
            <span className="flex items-center gap-3">
              {theme === "light" ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
            <span className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700 relative p-0.5 transition-all">
              <span className={`block w-3 h-3 rounded-full bg-white dark:bg-slate-900 shadow transition-all ${
                theme === "dark" ? "translate-x-4" : ""
              }`} />
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Frame ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* ── Mobile Header ── */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-base">
              AP
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Agent Portal
              </h1>
              {isProfileLocked && (
                <span className="text-[8px] bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-extrabold px-1.5 py-0.2 rounded-full border border-rose-100 dark:border-rose-900/50 block">
                  Profile Incomplete
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* ── Mobile Sidebar Drawer ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-80 bg-white dark:bg-slate-900 p-6 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 animate-slide-up-sheet">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold">AP</div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Agent Portal</h2>
                    {isProfileLocked && (
                      <span className="text-[8px] text-rose-500 font-bold">Profile Incomplete</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  const showLockHint = isProfileLocked && ["Trips", "Bookings", "Customers", "Analytics"].includes(item.label);

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary dark:text-primary-light"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                      {showLockHint && (
                        <Lock className="w-3 h-3 ml-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    Dark Mode
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content Area ── */}
        <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* ── Mobile Bottom Navigation Bar (Traveloop Explore style) ── */}
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40 h-16 rounded-2xl bottom-nav-bg border border-slate-200/60 dark:border-slate-800/60 shadow-lg flex items-center justify-around px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                  isActive ? "text-primary scale-105" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              location.pathname.startsWith("/profile") ? "text-primary scale-105" : "text-slate-400"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1 tracking-tight">Profile</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
