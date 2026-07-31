import React from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

interface SidebarLink {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface SidebarProps {
  links: SidebarLink[];
  activePath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
  onLogout?: () => void;
  logo?: React.ReactNode;
  pinned?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  links,
  activePath,
  onNavigate,
  collapsed,
  onCollapseToggle,
  onLogout,
  logo,
  pinned = false,
}) => {
  const isCollapsed = pinned ? false : collapsed;

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-border/40 bg-surface/40 backdrop-blur-md transition-all duration-300 ${
        isCollapsed ? "w-sidebar-collapsed" : "w-sidebar-expanded"
      } h-screen fixed top-0 left-0 z-30`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo Section */}
      <div className={`p-4 ${pinned ? "" : "border-b border-border"} flex ${isCollapsed ? "justify-center" : "justify-between items-center"} gap-3 shrink-0`}>
        {!isCollapsed && logo}
        {!pinned && (
          <button
            onClick={onCollapseToggle}
            className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border transition-all touch-target"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto scrollbar-none" role="menu">
        {links.map((link) => {
          const isActive = activePath === link.path;
          return (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all relative ${
                isActive
                  ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                  : "bg-transparent border-transparent hover:bg-surface-2/50 text-text-secondary hover:text-text-primary"
              } ${isCollapsed ? "justify-center p-3" : ""}`}
              title={isCollapsed ? link.label : undefined}
              role="menuitem"
              aria-current={isActive ? "page" : undefined}
            >
              <span className="shrink-0 relative">
                {link.icon}
                {link.badge && link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </span>
              {!isCollapsed && <span className="text-sm">{link.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer - Pinned to bottom */}
      {onLogout && (
        <div className={`p-4 ${pinned ? "mt-auto" : "border-t border-border"} shrink-0`}>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 transition-all ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Log Out" : undefined}
            role="menuitem"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-sm">Log Out</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
