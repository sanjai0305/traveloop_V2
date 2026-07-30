// src/components/activities/ActivityTags.jsx

import React from "react";

import {
  Sparkles,
} from "lucide-react";

const ActivityTags = ({
  tags = [],
}) => {
  return (
    <div
      className="
        flex
        flex-wrap
        
        items-center
        
        gap-3
      "
    >
      {tags.map((tag, index) => (
        <div
          key={index}
          className="
            group
            
            flex
            items-center
            gap-2
            
            px-4
            py-2
            
            rounded-full
            
            bg-gradient-to-r
            from-teal-50
            to-cyan-50
            
            border
            border-teal-100
            
            text-teal-700
            
            shadow-sm
            
            hover:shadow-md
            hover:border-teal-300
            
            transition-all
            duration-300
          "
        >
          
          {/* ICON */}
          <Sparkles
            size={14}
            className="
              text-teal-500
              
              transition-transform
              duration-300
              
              group-hover:rotate-12
            "
          />

          {/* TEXT */}
          <span
            className="
              text-sm
              
              font-semibold
              
              tracking-wide
            "
          >
            {tag}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ActivityTags;