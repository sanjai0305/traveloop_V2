// src/components/common/Avatar.jsx — Reusable Avatar component with initial gradient fallback

import React, { useState, useEffect } from "react";

const Avatar = ({ user, size = 36, onClick, className = "" }) => {
  const [imageError, setImageError] = useState(false);

  // Reset image error state if user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);

  // Extract initials: first letter of first name and last name, or just first name
  let initials = "";
  if (user?.firstName) {
    initials += user.firstName[0].toUpperCase();
  }
  if (user?.lastName) {
    initials += user.lastName[0].toUpperCase();
  }

  // Fallback to name if firstName/lastName not set
  if (!initials && user?.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts[0] && parts[0][0]) {
      initials += parts[0][0].toUpperCase();
    }
    if (parts[1] && parts[1][0]) {
      initials += parts[1][0].toUpperCase();
    }
  }

  // Limit initials to 2 characters max
  if (initials.length > 2) {
    initials = initials.substring(0, 2);
  }

  const fallback = initials || "👤";
  const hasAvatar = user?.avatar && !imageError;

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.max(11, Math.floor(size * 0.38))}px`,
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-full flex items-center justify-center text-white font-extrabold shadow-brand overflow-hidden flex-shrink-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        ...style,
        background: hasAvatar ? "none" : "linear-gradient(135deg, #14B8B5, #0D9488)",
      }}
    >
      {hasAvatar ? (
        <img
          src={user.avatar}
          alt={user.firstName || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
};

export default Avatar;
