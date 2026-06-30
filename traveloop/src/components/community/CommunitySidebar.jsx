// src/components/community/CommunitySidebar.jsx

import React from "react";

// COMPONENTS
import CommunityAboutCard from "./CommunityAboutCard";
import CommunityFeatures from "./CommunityFeatures";

const CommunitySidebar = () => {
  return (
    <div
      className="
        flex
        flex-col
        
        gap-6
      "
    >
      
      {/* ABOUT CARD */}
      <CommunityAboutCard />

      {/* FEATURES */}
      <CommunityFeatures />
    </div>
  );
};

export default CommunitySidebar;