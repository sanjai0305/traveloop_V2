// src/components/notes/NoteMetaInfo.jsx

import React from "react";

import {
  CalendarDays,
  Clock,
} from "lucide-react";

const NoteMetaInfo = ({ date }) => {
  
  // FORMAT DATE (simple UI format)
  const formattedDate = new Date(date).toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div
      className="
        flex
        flex-wrap
        
        items-center
        
        gap-5
      "
    >
      
      {/* DATE */}
      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <div
          className="
            w-10
            h-10
            
            rounded-2xl
            
            bg-teal-50
            
            flex
            items-center
            justify-center
          "
        >
          <CalendarDays
            size={18}
            className="
              text-teal-600
            "
          />
        </div>

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
            Date
          </p>

          <p
            className="
              text-sm
              
              font-bold
              
              text-slate-700
            "
          >
            {formattedDate}
          </p>
        </div>
      </div>

      {/* STATUS */}
      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <div
          className="
            w-10
            h-10
            
            rounded-2xl
            
            bg-orange-50
            
            flex
            items-center
            justify-center
          "
        >
          <Clock
            size={18}
            className="
              text-orange-500
            "
          />
        </div>

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
            Status
          </p>

          <p
            className="
              text-sm
              
              font-bold
              
              text-slate-700
            "
          >
            Saved Note
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoteMetaInfo;