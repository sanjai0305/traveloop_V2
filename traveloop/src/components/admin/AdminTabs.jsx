// src/components/admin/AdminTabs.jsx

import React, { useState } from "react";

import {
  LayoutDashboard,
  Users,
  MapPinned,
  Star,
  BarChart3,
} from "lucide-react";

const tabs = [
  {
    id: 1,
    label: "Overview",
    icon: LayoutDashboard,
  },

  {
    id: 2,
    label: "Users",
    icon: Users,
  },

  {
    id: 3,
    label: "Cities",
    icon: MapPinned,
  },

  {
    id: 4,
    label: "Activities",
    icon: Star,
  },

  {
    id: 5,
    label: "Analytics",
    icon: BarChart3,
  },
];

const AdminTabs = () => {
  
  // ACTIVE TAB
  const [activeTab, setActiveTab] =
    useState("Overview");

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

export default AdminTabs;