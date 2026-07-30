// src/components/profile/ContactInfo.jsx

import React from "react";

import {
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

const ContactInfo = () => {
  return (
    <div
      className="
        grid
        grid-cols-1
        md:grid-cols-2
        
        gap-5
      "
    >
      
      {/* EMAIL */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-2xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        <div
          className="
            w-12
            h-12
            
            rounded-xl
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            flex
            items-center
            justify-center
          "
        >
          <Mail size={20} />
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Email
          </p>

          <h4 className="text-sm font-semibold text-slate-700">
            arjun@gmail.com
          </h4>
        </div>
      </div>

      {/* PHONE */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-2xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        <div
          className="
            w-12
            h-12
            
            rounded-xl
            
            bg-gradient-to-br
            from-cyan-500
            to-sky-500
            
            text-white
            
            flex
            items-center
            justify-center
          "
        >
          <Phone size={20} />
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Phone
          </p>

          <h4 className="text-sm font-semibold text-slate-700">
            +91 98765 43210
          </h4>
        </div>
      </div>

      {/* LOCATION */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-2xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        <div
          className="
            w-12
            h-12
            
            rounded-xl
            
            bg-gradient-to-br
            from-orange-400
            to-pink-500
            
            text-white
            
            flex
            items-center
            justify-center
          "
        >
          <MapPin size={20} />
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Location
          </p>

          <h4 className="text-sm font-semibold text-slate-700">
            Chennai, India
          </h4>
        </div>
      </div>

      {/* MEMBER SINCE */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-2xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        <div
          className="
            w-12
            h-12
            
            rounded-xl
            
            bg-gradient-to-br
            from-purple-500
            to-indigo-500
            
            text-white
            
            flex
            items-center
            justify-center
          "
        >
          <Calendar size={20} />
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Member Since
          </p>

          <h4 className="text-sm font-semibold text-slate-700">
            Jan 2024
          </h4>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;