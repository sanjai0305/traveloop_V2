import React from "react";
import { Menu, Bell, Search, User } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showMenu?: boolean;
  showNotifications?: boolean;
  showSearch?: boolean;
  showUser?: boolean;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onSearchClick?: () => void;
  onUserClick?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showMenu = true,
  showNotifications = true,
  showSearch = false,
  showUser = true,
  onMenuClick,
  onNotificationClick,
  onSearchClick,
  onUserClick,
  rightContent,
  className = "",
}) => {
  return (
    <header
      className={`sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border px-content-desktop py-safe-top md:px-content-desktop lg:px-content-desktop ${className}`}
    >
      <div className="traveloop-container flex items-center justify-between h-16">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-surface-2 transition-colors touch-target"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {(title || subtitle) && (
            <div className="flex flex-col">
              {title && (
                <h1 className="text-heading-md font-bold text-text-primary">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-body-sm text-text-secondary">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="p-2 rounded-lg hover:bg-surface-2 transition-colors touch-target"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          
          {showNotifications && (
            <button
              onClick={onNotificationClick}
              className="p-2 rounded-lg hover:bg-surface-2 transition-colors touch-target relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
          )}
          
          {showUser && (
            <button
              onClick={onUserClick}
              className="p-2 rounded-lg hover:bg-surface-2 transition-colors touch-target"
              aria-label="User profile"
            >
              <User className="w-5 h-5" />
            </button>
          )}
          
          {rightContent}
        </div>
      </div>
    </header>
  );
};

export default Header;
