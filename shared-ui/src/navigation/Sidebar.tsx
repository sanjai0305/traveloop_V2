import React from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

interface SidebarLink {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarProps {
  links: SidebarLink[];
  activePath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  links,
  activePath,
  onNavigate,
  collapsed,
  onCollapseToggle,
  onLogout,
}) => {
  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } h-screen sticky top-0 shrink-0 z-30`}
    >
      {/* Collapse Toggle handle */}
      <div className={`p-4 border-b border-slate-900 flex ${collapsed ? "justify-center" : "justify-between"} items-center`}>
        {!collapsed && (
          <span className="font-poppins font-black text-xs text-slate-500 uppercase tracking-widest">
            Navigation Menu
          </span>
        )}
        <button
          onClick={onCollapseToggle}
          className="p-1 rounded bg-slate-900 border border-slate-850 hover:text-white text-slate-400 transition-all"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto scrollbar-none">
        {links.map((link) => {
          const isActive = activePath === link.path;
          return (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`w-full flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-teal-500/30 text-teal-400 font-bold"
                  : "bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200"
              } ${collapsed ? "justify-center p-3" : ""}`}
              title={collapsed ? link.label : undefined}
            >
              <span className="shrink-0">{link.icon}</span>
              {!collapsed && <span className="text-xs font-poppins">{link.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      {onLogout && (
        <div className="p-2 border-t border-slate-900">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Log Out" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-xs font-poppins">Log Out</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
