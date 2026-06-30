// src/components/dashboard/SearchBar.jsx

import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ value = "", onChange }) => {
  return (
    <div
      className="
        flex
        items-center
        gap-3

        px-4
        py-3.5

        rounded-full

        bg-white

        border
        border-slate-200

        shadow-xs

        focus-within:border-teal-400
        focus-within:shadow-sm
        focus-within:ring-4
        focus-within:ring-teal-50

        transition-all
        duration-200
      "
    >
      {/* ICON */}
      <Search size={18} className="text-slate-400 flex-shrink-0" />

      {/* INPUT */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search destinations, trips..."
        className="
          flex-1
          bg-transparent
          text-slate-700
          text-sm
          font-medium
          placeholder:text-slate-400
          outline-none
        "
      />

      {/* CLEAR */}
      {value && (
        <button
          onClick={() => onChange?.("")}
          className="
            flex
            items-center
            justify-center
            w-5
            h-5
            rounded-full
            bg-slate-200
            text-slate-500
            flex-shrink-0
          "
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;