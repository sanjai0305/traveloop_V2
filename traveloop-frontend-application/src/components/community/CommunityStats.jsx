// src/components/community/CommunityStats.jsx

import React from "react";

import {
  Users,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

const CommunityStats = ({
  members = "0",
  posts = "0",
}) => {
  return (
    <div
      className="
        flex
        flex-wrap
        
        items-center
        
        gap-5
      "
    >
      
      {/* MEMBERS */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-3xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-12
            h-12
            
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
          <Users size={22} />
        </div>

        {/* TEXT */}
        <div>
          <p
            className="
              text-xs
              
              uppercase
              
              tracking-[2px]
              
              text-slate-400
              
              font-semibold
            "
          >
            Members
          </p>

          <h3
            className="
              mt-1
              
              text-2xl
              
              font-extrabold
              
              text-slate-900
            "
          >
            {members}
          </h3>
        </div>
      </div>

      {/* POSTS */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-3xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-12
            h-12
            
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
          <MessageSquare
            size={22}
          />
        </div>

        {/* TEXT */}
        <div>
          <p
            className="
              text-xs
              
              uppercase
              
              tracking-[2px]
              
              text-slate-400
              
              font-semibold
            "
          >
            Posts
          </p>

          <h3
            className="
              mt-1
              
              text-2xl
              
              font-extrabold
              
              text-slate-900
            "
          >
            {posts}
          </h3>
        </div>
      </div>

      {/* TRENDING */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-3xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-12
            h-12
            
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
          <TrendingUp
            size={22}
          />
        </div>

        {/* TEXT */}
        <div>
          <p
            className="
              text-xs
              
              uppercase
              
              tracking-[2px]
              
              text-slate-400
              
              font-semibold
            "
          >
            Activity
          </p>

          <h3
            className="
              mt-1
              
              text-2xl
              
              font-extrabold
              
              text-emerald-500
            "
          >
            Active
          </h3>
        </div>
      </div>
    </div>
  );
};

export default CommunityStats;