import React from "react";

interface TabLink {
  label: string;
  icon: React.ReactNode;
  path: string;
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-lg border-t border-slate-900 px-2 flex items-center justify-around z-40 pb-safe-bottom">
      {links.map((link) => {
        const isActive = activePath === link.path;
        return (
          <button
            key={link.path}
            onClick={() => onNavigate(link.path)}
            className={`flex flex-col items-center justify-center w-14 h-12 transition-all ${
              isActive
                ? "text-teal-400 font-bold"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1.5 rounded-full transition-transform ${isActive ? "scale-105 text-teal-400" : ""}`}>
              {link.icon}
            </div>
            <span className="text-[9px] font-poppins tracking-wider truncate max-w-full">
              {link.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomTabs;
