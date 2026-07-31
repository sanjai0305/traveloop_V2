// src/components/profile/ProfileCard.jsx

import React from "react";

import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
} from "lucide-react";

import ProfileAvatar from "./ProfileAvatar";
import EditProfileButton from "./EditProfileButton";
import ProfileStats from "./ProfileStats";
import ContactInfo from "./ContactInfo";

// IMAGE
import UserImage from "../../assets/images/user-profile.jpg";

const ProfileCard = () => {
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
        
        px-6
        md:px-10
        
        py-10
      "
    >
      
      {/* TOP GLOW */}
      <div
        className="
          absolute
          top-[-120px]
          right-[-120px]
          
          w-80
          h-80
          
          bg-cyan-200/20
          
          rounded-full
          
          blur-3xl
        "
      />

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          
          flex
          flex-col
          lg:flex-row
          
          items-start
          
          gap-10
        "
      >
        
        {/* LEFT - AVATAR */}
        <div
          className="
            flex
            flex-col
            items-center
          "
        >
          <ProfileAvatar image={UserImage} />

          <EditProfileButton />
        </div>

        {/* RIGHT - INFO */}
        <div className="flex-1">
          
          {/* NAME + EDIT */}
          <div
            className="
              flex
              items-start
              justify-between
              
              gap-5
            "
          >
            
            <div>
              <h2
                className="
                  text-3xl
                  md:text-4xl
                  
                  font-extrabold
                  
                  text-slate-800
                "
              >
                Arjun Sharma
              </h2>

              <p
                className="
                  mt-2
                  
                  text-teal-600
                  
                  font-medium
                "
              >
                Travel enthusiast | Explorer | Dreamer ✈️
              </p>

              <p
                className="
                  mt-4
                  
                  text-slate-500
                  
                  max-w-2xl
                  
                  leading-7
                "
              >
                Love exploring new places, cultures and capturing memories.
                Always planning the next adventure!
              </p>
            </div>

            {/* STATS */}
            <div className="hidden lg:block">
              <ProfileStats />
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="mt-8">
            <ContactInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;