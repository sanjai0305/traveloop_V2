// src/components/community/CommunityCard.jsx

import React, { useState } from "react";

import {
  Heart,
  MessageCircle,
  Users,
  ArrowRight,
} from "lucide-react";

// COMPONENTS
import CommunityStats from "./CommunityStats";
import CommunityMembers from "./CommunityMembers";
import CommunityActionButton from "./CommunityActionButton";

const CommunityCard = ({
  community,
}) => {
  
  // FAVORITE
  const [liked, setLiked] =
    useState(false);

  return (
    <div
      className="
        group
        
        relative
        
        overflow-hidden
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[36px]
        
        shadow-sm
        
        hover:shadow-xl
        
        transition-all
        duration-500
        
        hover:-translate-y-1
      "
    >
      
      <div
        className="
          flex
          flex-col
          xl:flex-row
        "
      >
        
        {/* IMAGE */}
        <div
          className="
            relative
            
            xl:w-[360px]
            w-full
            
            h-[280px]
            md:h-[320px]
            xl:h-auto
            
            overflow-hidden
            
            flex-shrink-0
          "
        >
          
          {/* IMAGE */}
          <img
            src={community.image}
            alt={community.title}
            className="
              w-full
              h-full
              
              object-cover
              
              transition-transform
              duration-700
              
              group-hover:scale-105
            "
          />

          {/* OVERLAY */}
          <div
            className="
              absolute
              inset-0
              
              bg-gradient-to-t
              from-black/70
              via-black/10
              to-transparent
            "
          />

          {/* FAVORITE */}
          <button
            onClick={() =>
              setLiked(!liked)
            }
            className="
              absolute
              top-5
              right-5
              
              w-12
              h-12
              
              rounded-full
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
              
              flex
              items-center
              justify-center
              
              shadow-lg
              
              hover:scale-110
              
              transition-all
              duration-300
            "
          >
            <Heart
              className={`
                w-5
                h-5
                
                transition-all
                duration-300
                
                ${
                  liked
                    ? "fill-red-500 text-red-500"
                    : "text-white"
                }
              `}
            />
          </button>

          {/* BADGE */}
          <div
            className="
              absolute
              bottom-5
              left-5
              
              flex
              items-center
              gap-2
              
              px-4
              py-2
              
              rounded-full
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
              
              text-white
              
              text-sm
              
              font-semibold
            "
          >
            <Users size={16} />

            <span>
              Active Community
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="
            flex-1
            
            p-6
            md:p-8
            
            flex
            flex-col
            justify-between
          "
        >
          
          {/* TOP */}
          <div>
            
            {/* TAGS */}
            <div
              className="
                flex
                flex-wrap
                
                items-center
                
                gap-3
              "
            >
              {community.tags.map(
                (tag, index) => (
                  <div
                    key={index}
                    className="
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
                    {tag}
                  </div>
                )
              )}
            </div>

            {/* TITLE */}
            <h2
              className="
                mt-5
                
                text-3xl
                md:text-4xl
                
                font-extrabold
                
                text-slate-900
                
                leading-tight
              "
            >
              {community.title}
            </h2>

            {/* DESCRIPTION */}
            <p
              className="
                mt-5
                
                text-slate-500
                
                text-base
                md:text-lg
                
                leading-8
                
                max-w-3xl
              "
            >
              {community.description}
            </p>

            {/* STATS */}
            <div className="mt-7">
              <CommunityStats
                members={
                  community.members
                }
                posts={
                  community.posts
                }
              />
            </div>

            {/* MEMBERS */}
            <div className="mt-7">
              <CommunityMembers
                members={
                  community.memberImages
                }
              />
            </div>
          </div>

          {/* FOOTER */}
          <div
            className="
              mt-8
              
              flex
              flex-col
              lg:flex-row
              
              items-start
              lg:items-center
              
              justify-between
              
              gap-5
            "
          >
            
            {/* LEFT */}
            <div
              className="
                flex
                items-center
                gap-3
                
                text-slate-500
                
                font-medium
              "
            >
              <MessageCircle
                size={18}
              />

              <span>
                Join conversations &
                connect with travelers
              </span>
            </div>

            {/* BUTTON */}
            <CommunityActionButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;