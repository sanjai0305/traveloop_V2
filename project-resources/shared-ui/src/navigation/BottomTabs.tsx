import React from "react";

interface TabLink {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface BottomTabsProps {
  links: TabLink[];
  activePath: string;
  onNavigate: (path: string) => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  links,
  activePath,
  onNavigate,
}) => {
  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-lg border-t border-border px-2 flex items-center justify-around z-40 pb-safe-bottom"
      role="navigation"
      aria-label="Bottom navigation"
    >
      {links.map((link) => {
        const isActive = activePath === link.path;
        return (
          <button
            key={link.path}
            onClick={() => onNavigate(link.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
              isActive
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-label={link.label}
            aria-current={isActive ? "page" : undefined}
          >
            <div className={`p-2 rounded-xl transition-transform relative ${isActive ? "scale-110" : ""}`}>
              {link.icon}
              {link.badge && link.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {link.badge > 9 ? "9+" : link.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1 truncate max-w-full">
              {link.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomTabs;
