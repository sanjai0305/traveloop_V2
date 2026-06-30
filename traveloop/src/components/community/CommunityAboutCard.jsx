// src/components/community/CommunityAboutCard.jsx

import React from "react";

import {
  Globe2,
  Users,
  Sparkles,
  MapPinned,
} from "lucide-react";

const CommunityAboutCard = () => {
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
          top-[-120px]
          right-[-120px]
          
          w-[260px]
          h-[260px]
          
          rounded-full
          
          bg-cyan-200/20
          
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
            Global Travel Network
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-5
            
            text-3xl
            
            font-extrabold
            
            text-slate-900
            
            leading-tight
          "
        >
          About Communities
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-4
            
            text-slate-500
            
            leading-8
            
            text-base
          "
        >
          Join passionate travelers from around
          the world, exchange experiences, explore
          destinations, and discover exciting
          adventures together.
        </p>

        {/* STATS */}
        <div
          className="
            mt-8
            
            flex
            flex-col
            
            gap-5
          "
        >
          
          {/* CARD */}
          <div
            className="
              flex
              items-center
              gap-4
              
              p-5
              
              rounded-3xl
              
              bg-slate-50
              
              border
              border-slate-200
            "
          >
            
            {/* ICON */}
            <div
              className="
                w-14
                h-14
                
                rounded-2xl
                
                bg-gradient-to-br
                from-teal-500
                to-cyan-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <Users size={24} />
            </div>

            {/* TEXT */}
            <div>
              <h3
                className="
                  text-2xl
                  
                  font-extrabold
                  
                  text-slate-900
                "
              >
                1M+
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Travelers Connected
              </p>
            </div>
          </div>

          {/* CARD */}
          <div
            className="
              flex
              items-center
              gap-4
              
              p-5
              
              rounded-3xl
              
              bg-slate-50
              
              border
              border-slate-200
            "
          >
            
            {/* ICON */}
            <div
              className="
                w-14
                h-14
                
                rounded-2xl
                
                bg-gradient-to-br
                from-orange-400
                to-pink-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <Globe2 size={24} />
            </div>

            {/* TEXT */}
            <div>
              <h3
                className="
                  text-2xl
                  
                  font-extrabold
                  
                  text-slate-900
                "
              >
                120+
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Travel Communities
              </p>
            </div>
          </div>

          {/* CARD */}
          <div
            className="
              flex
              items-center
              gap-4
              
              p-5
              
              rounded-3xl
              
              bg-slate-50
              
              border
              border-slate-200
            "
          >
            
            {/* ICON */}
            <div
              className="
                w-14
                h-14
                
                rounded-2xl
                
                bg-gradient-to-br
                from-cyan-500
                to-sky-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <MapPinned size={24} />
            </div>

            {/* TEXT */}
            <div>
              <h3
                className="
                  text-2xl
                  
                  font-extrabold
                  
                  text-slate-900
                "
              >
                250+
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Destinations Shared
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityAboutCard;