// src/components/admin/AdminFeatureList.jsx

import React from "react";

import {
  Users,
  MapPinned,
  Star,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    id: 1,
    title: "User Management",
    description:
      "Manage users, permissions, and account activities across the platform.",
    icon: Users,
    gradient:
      "from-teal-500 to-cyan-500",
  },

  {
    id: 2,
    title: "Cities Analytics",
    description:
      "Analyze the most popular travel destinations and booking trends.",
    icon: MapPinned,
    gradient:
      "from-orange-400 to-pink-500",
  },

  {
    id: 3,
    title: "Activities Insights",
    description:
      "Track top-rated travel activities and user engagement statistics.",
    icon: Star,
    gradient:
      "from-cyan-500 to-sky-500",
  },

  {
    id: 4,
    title: "Growth Monitoring",
    description:
      "Monitor platform growth, revenue, and performance analytics.",
    icon: TrendingUp,
    gradient:
      "from-emerald-500 to-green-500",
  },

  {
    id: 5,
    title: "Secure Control",
    description:
      "Maintain platform security and administrative system protection.",
    icon: ShieldCheck,
    gradient:
      "from-purple-500 to-indigo-500",
  },
];

const AdminFeatureList = () => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[36px]
        
        shadow-sm
        
        p-7
      "
    >
      
      {/* GLOW */}
      <div
        className="
          absolute
          bottom-[-120px]
          left-[-120px]
          
          w-[240px]
          h-[240px]
          
          rounded-full
          
          bg-teal-200/20
          
          blur-3xl
        "
      />

      {/* CONTENT */}
      <div className="relative z-10">
        
        {/* BADGE */}
        <div
          className="
            flex
            items-center
            gap-2
            
            w-fit
            
            px-4
            py-2
            
            rounded-full
            
            bg-teal-50
            
            border
            border-teal-100
            
            text-teal-700
            
            text-sm
            
            font-semibold
          "
        >
          <Sparkles size={16} />

          <span>
            Admin Features
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-5
            
            text-3xl
            
            font-extrabold
            
            text-slate-900
          "
        >
          Core Features
        </h2>

        {/* FEATURES */}
        <div
          className="
            mt-8
            
            flex
            flex-col
            
            gap-5
          "
        >
          {features.map(
            (feature) => {
              const Icon =
                feature.icon;

              return (
                <div
                  key={feature.id}
                  className="
                    flex
                    items-start
                    gap-4
                    
                    p-5
                    
                    rounded-3xl
                    
                    bg-slate-50
                    
                    border
                    border-slate-200
                    
                    hover:bg-white
                    hover:shadow-md
                    
                    transition-all
                    duration-300
                  "
                >
                  
                  {/* ICON */}
                  <div
                    className={`
                      min-w-[56px]
                      min-h-[56px]
                      
                      rounded-2xl
                      
                      bg-gradient-to-br
                      ${feature.gradient}
                      
                      text-white
                      
                      flex
                      items-center
                      justify-center
                      
                      shadow-md
                    `}
                  >
                    <Icon
                      size={24}
                    />
                  </div>

                  {/* TEXT */}
                  <div>
                    <h3
                      className="
                        text-lg
                        
                        font-bold
                        
                        text-slate-900
                      "
                    >
                      {feature.title}
                    </h3>

                    <p
                      className="
                        mt-2
                        
                        text-slate-500
                        
                        text-sm
                        
                        leading-7
                      "
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeatureList;