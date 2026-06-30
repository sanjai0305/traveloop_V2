// src/components/notes/NotesTabs.jsx

import React, { useState } from "react";

import {
  LayoutGrid,
  CalendarDays,
  MapPinned,
  Star,
} from "lucide-react";

const tabs = [
  {
    id: 1,
    label: "All Notes",
    icon: LayoutGrid,
  },

  {
    id: 2,
    label: "Day Notes",
    icon: CalendarDays,
  },

  {
    id: 3,
    label: "Stop Notes",
    icon: MapPinned,
  },

  {
    id: 4,
    label: "Important",
    icon: Star,
  },
];

const NotesTabs = () => {
  
  // ACTIVE TAB
  const [activeTab, setActiveTab] =
    useState("All Notes");

  return (
    <div
      className="
        flex
        flex-wrap
        
        items-center
        
        gap-4
      "
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;

        const isActive =
          activeTab === tab.label;

        return (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(
                tab.label
              )
            }
            className={`
              flex
              items-center
              gap-3
              
              px-6
              py-4
              
              rounded-2xl
              
              border
              
              font-semibold
              
              transition-all
              duration-300
              
              ${
                isActive
                  ? `
                    bg-gradient-to-r
                    from-teal-500
                    to-cyan-500
                    
                    text-white
                    
                    border-transparent
                    
                    shadow-lg
                  `
                  : `
                    bg-white
                    
                    text-slate-700
                    
                    border-slate-200
                    
                    hover:border-teal-300
                    hover:text-teal-600
                    hover:shadow-md
                  `
              }
            `}
          >
            
            {/* ICON */}
            <div
              className={`
                w-10
                h-10
                
                rounded-xl
                
                flex
                items-center
                justify-center
                
                ${
                  isActive
                    ? `
                      bg-white/15
                    `
                    : `
                      bg-slate-100
                    `
                }
              `}
            >
              <Icon
                size={20}
              />
            </div>

            {/* LABEL */}
            <span
              className="
                text-sm
                md:text-base
              "
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default NotesTabs;