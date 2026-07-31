// src/components/packing/PackingCategoryCard.jsx

import React from "react";

import {
  Sparkles,
  CheckCircle2,
} from "lucide-react";

// COMPONENTS
import PackingChecklistItem from "./PackingChecklistItem";

const PackingCategoryCard = ({
  category,
}) => {
  
  // CALCULATE
  const packedCount =
    category.items.filter(
      (item) => item.packed
    ).length;

  const totalCount =
    category.items.length;

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
        
        hover:shadow-lg
        
        transition-all
        duration-500
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
        
        {/* TOP */}
        <div
          className="
            flex
            flex-col
            lg:flex-row
            
            items-start
            lg:items-center
            
            justify-between
            
            gap-6
            
            px-6
            md:px-8
            
            py-7
          "
        >
          
          {/* LEFT */}
          <div
            className="
              flex
              items-start
              gap-5
            "
          >
            
            {/* ICON */}
            <div
              className="
                min-w-[90px]
                min-h-[90px]
                
                rounded-[28px]
                
                bg-gradient-to-br
                from-teal-500
                to-cyan-500
                
                flex
                items-center
                justify-center
                
                shadow-[0_15px_35px_rgba(6,182,212,0.35)]
              "
            >
              <img
                src={category.icon}
                alt={category.title}
                className="
                  w-12
                  h-12
                  
                  object-contain
                "
              />
            </div>

            {/* TEXT */}
            <div>
              
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
                <Sparkles
                  size={16}
                />

                <span>
                  Smart Packing Category
                </span>
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
                {category.title}
              </h2>

              {/* DESCRIPTION */}
              <p
                className="
                  mt-4
                  
                  max-w-3xl
                  
                  text-slate-500
                  
                  text-base
                  md:text-lg
                  
                  leading-8
                "
              >
                {category.description}
              </p>
            </div>
          </div>

          {/* STATUS */}
          <div
            className="
              flex
              items-center
              gap-4
              
              px-6
              py-5
              
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
                w-14
                h-14
                
                rounded-2xl
                
                bg-gradient-to-br
                from-emerald-500
                to-green-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <CheckCircle2
                size={26}
              />
            </div>

            {/* TEXT */}
            <div>
              <h3
                className="
                  text-3xl
                  
                  font-extrabold
                  
                  text-slate-900
                "
              >
                {packedCount}/
                {totalCount}
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Packed Items
              </p>
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div
          className="
            px-6
            md:px-8
            
            pb-8
            
            flex
            flex-col
            
            gap-5
          "
        >
          {category.items.map(
            (item) => (
              <PackingChecklistItem
                key={item.id}
                item={item}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingCategoryCard;