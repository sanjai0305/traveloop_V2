// src/components/admin/AdminInfoCard.jsx

import React from "react";

import {
  ShieldCheck,
  Sparkles,
  UserCheck,
  Bell,
} from "lucide-react";

const AdminInfoCard = () => {
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
          
          w-[240px]
          h-[240px]
          
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
            Administrator Access
          </span>
        </div>

        {/* PROFILE */}
        <div
          className="
            mt-8
            
            flex
            items-center
            
            gap-5
          "
        >
          
          {/* AVATAR */}
          <div
            className="
              w-24
              h-24
              
              rounded-full
              
              bg-gradient-to-br
              from-teal-500
              to-cyan-500
              
              flex
              items-center
              justify-center
              
              text-white
              
              shadow-[0_15px_35px_rgba(6,182,212,0.35)]
            "
          >
            <ShieldCheck
              size={42}
            />
          </div>

          {/* TEXT */}
          <div>
            <h2
              className="
                text-3xl
                
                font-extrabold
                
                text-slate-900
              "
            >
              Admin
            </h2>

            <p
              className="
                mt-2
                
                text-slate-500
                
                text-base
              "
            >
              Platform Super Admin
            </p>

            <div
              className="
                mt-4
                
                flex
                items-center
                gap-2
                
                text-emerald-500
                
                font-semibold
              "
            >
              <UserCheck
                size={18}
              />

              <span>
                Verified Access
              </span>
            </div>
          </div>
        </div>

        {/* INFO */}
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
              justify-between
              
              p-5
              
              rounded-3xl
              
              bg-slate-50
              
              border
              border-slate-200
            "
          >
            
            {/* LEFT */}
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
                Access Level
              </p>

              <h3
                className="
                  mt-2
                  
                  text-xl
                  
                  font-bold
                  
                  text-slate-900
                "
              >
                Full Control
              </h3>
            </div>

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
              <Bell size={24} />
            </div>
          </div>

          {/* CARD */}
          <div
            className="
              flex
              items-center
              justify-between
              
              p-5
              
              rounded-3xl
              
              bg-slate-50
              
              border
              border-slate-200
            "
          >
            
            {/* LEFT */}
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
                System Status
              </p>

              <h3
                className="
                  mt-2
                  
                  text-xl
                  
                  font-bold
                  
                  text-emerald-500
                "
              >
                All Systems Active
              </h3>
            </div>

            {/* DOT */}
            <div
              className="
                w-5
                h-5
                
                rounded-full
                
                bg-emerald-500
                
                shadow-[0_0_20px_rgba(34,197,94,0.6)]
              "
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfoCard;