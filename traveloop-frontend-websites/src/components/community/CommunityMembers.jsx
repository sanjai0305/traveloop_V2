// src/components/community/CommunityMembers.jsx

import React from "react";

import {
  Users,
} from "lucide-react";

const CommunityMembers = ({
  members = [],
}) => {
  return (
    <div>
      
      {/* LABEL */}
      <div
        className="
          flex
          items-center
          gap-2
          
          mb-4
        "
      >
        <Users
          size={16}
          className="
            text-teal-500
          "
        />

        <p
          className="
            text-sm
            
            font-semibold
            
            text-slate-500
            
            uppercase
            
            tracking-[2px]
          "
        >
          Active Members
        </p>
      </div>

      {/* MEMBERS */}
      <div
        className="
          flex
          items-center
        "
      >
        {members.map(
          (member, index) => (
            <div
              key={index}
              className={`
                relative
                
                w-14
                h-14
                
                rounded-full
                
                border-4
                border-white
                
                overflow-hidden
                
                shadow-md
                
                ${
                  index !== 0
                    ? "-ml-4"
                    : ""
                }
              `}
            >
              
              {/* IMAGE */}
              <img
                src={member}
                alt={`Member ${index + 1}`}
                className="
                  w-full
                  h-full
                  
                  object-cover
                "
              />

              {/* ONLINE DOT */}
              <span
                className="
                  absolute
                  bottom-1
                  right-1
                  
                  w-4
                  h-4
                  
                  rounded-full
                  
                  bg-emerald-500
                  
                  border-2
                  border-white
                "
              />
            </div>
          )
        )}

        {/* EXTRA MEMBERS */}
        <div
          className="
            -ml-4
            
            w-14
            h-14
            
            rounded-full
            
            border-4
            border-white
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            flex
            items-center
            justify-center
            
            font-bold
            
            shadow-md
          "
        >
          +99
        </div>
      </div>
    </div>
  );
};

export default CommunityMembers;