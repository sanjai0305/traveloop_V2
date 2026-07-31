import React from "react";
import { Menu, Bell } from "lucide-react";
import Avatar from "../components/Avatar";

interface NavbarProps {
  onMenuToggle?: () => void;
  brandName?: string;
  userName?: string;
  userAvatar?: string;
  notificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuToggle,
  brandName = "Traveloop",
  userName = "Admin User",
  userAvatar,
  notificationsCount = 0,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 md:hidden rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="font-poppins font-black text-lg bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent tracking-wider">
          {brandName.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Alerts / Notifications */}
        <button
          className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-colors relative"
          aria-label="View notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
          )}
        </button>

        {/* User profile dropdown trigger */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-white font-poppins">{userName}</div>
          </div>
          <Avatar src={userAvatar} name={userName} size="sm" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
