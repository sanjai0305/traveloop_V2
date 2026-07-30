// src/components/myTrips/TripCardMenu.jsx

import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Share2,
} from "lucide-react";

const TripCardMenu = () => {
  
  // MENU STATE
  const [open, setOpen] =
    useState(false);

  // REF
  const menuRef = useRef(null);

  // CLOSE OUTSIDE CLICK
  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      
      {/* BUTTON */}
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="
          group
          
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
          
          text-white
          
          transition-all
          duration-300
          
          hover:scale-110
        "
      >
        <MoreVertical
          size={22}
          className="
            transition-transform
            duration-300
            
            group-hover:scale-110
          "
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute
            right-0
            top-[60px]
            
            w-[240px]
            
            rounded-3xl
            
            bg-white/95
            backdrop-blur-xl
            
            border
            border-slate-200
            
            shadow-[0_20px_60px_rgba(15,23,42,0.15)]
            
            overflow-hidden
            
            z-50
          "
        >
          
          {/* MENU */}
          <div className="p-3">
            
            {/* EDIT */}
            <button
              className="
                w-full
                
                flex
                items-center
                gap-4
                
                px-4
                py-4
                
                rounded-2xl
                
                text-slate-700
                
                hover:bg-slate-100
                hover:text-teal-600
                
                transition-all
                duration-300
              "
            >
              
              {/* ICON */}
              <div
                className="
                  w-11
                  h-11
                  
                  rounded-xl
                  
                  bg-slate-100
                  
                  flex
                  items-center
                  justify-center
                "
              >
                <Pencil size={20} />
              </div>

              {/* TEXT */}
              <span className="font-medium">
                Edit Trip
              </span>
            </button>

            {/* DUPLICATE */}
            <button
              className="
                w-full
                
                flex
                items-center
                gap-4
                
                px-4
                py-4
                
                rounded-2xl
                
                text-slate-700
                
                hover:bg-slate-100
                hover:text-cyan-600
                
                transition-all
                duration-300
              "
            >
              
              {/* ICON */}
              <div
                className="
                  w-11
                  h-11
                  
                  rounded-xl
                  
                  bg-slate-100
                  
                  flex
                  items-center
                  justify-center
                "
              >
                <Copy size={20} />
              </div>

              {/* TEXT */}
              <span className="font-medium">
                Duplicate Trip
              </span>
            </button>

            {/* SHARE */}
            <button
              className="
                w-full
                
                flex
                items-center
                gap-4
                
                px-4
                py-4
                
                rounded-2xl
                
                text-slate-700
                
                hover:bg-slate-100
                hover:text-sky-600
                
                transition-all
                duration-300
              "
            >
              
              {/* ICON */}
              <div
                className="
                  w-11
                  h-11
                  
                  rounded-xl
                  
                  bg-slate-100
                  
                  flex
                  items-center
                  justify-center
                "
              >
                <Share2 size={20} />
              </div>

              {/* TEXT */}
              <span className="font-medium">
                Share Trip
              </span>
            </button>

            {/* DELETE */}
            <button
              className="
                w-full
                
                flex
                items-center
                gap-4
                
                px-4
                py-4
                
                rounded-2xl
                
                text-red-500
                
                hover:bg-red-50
                
                transition-all
                duration-300
              "
            >
              
              {/* ICON */}
              <div
                className="
                  w-11
                  h-11
                  
                  rounded-xl
                  
                  bg-red-50
                  
                  flex
                  items-center
                  justify-center
                "
              >
                <Trash2 size={20} />
              </div>

              {/* TEXT */}
              <span className="font-medium">
                Delete Trip
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripCardMenu;