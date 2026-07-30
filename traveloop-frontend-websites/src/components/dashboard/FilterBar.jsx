// src/components/dashboard/FilterBar.jsx

import React, { useState } from "react";

const FILTERS = [
  { id: "all", label: "🌍 All" },
  { id: "popular", label: "🔥 Popular" },
  { id: "adventure", label: "🧗 Adventure" },
  { id: "beach", label: "🏖️ Beach" },
  { id: "mountains", label: "⛰️ Mountains" },
  { id: "city", label: "🏙️ City" },
  { id: "culture", label: "🎭 Culture" },
];

const FilterBar = ({ onFilter }) => {
  const [active, setActive] = useState("all");

  const handleSelect = (id) => {
    setActive(id);
    onFilter?.(id);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => handleSelect(filter.id)}
          className={`
            flex-shrink-0

            px-4
            py-2

            rounded-full

            text-sm
            font-medium

            transition-all
            duration-200

            active:scale-95

            ${
              active === filter.id
                ? "bg-teal-500 text-white shadow-brand"
                : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;