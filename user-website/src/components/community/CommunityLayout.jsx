// src/components/community/CommunityLayout.jsx

import React from "react";

// COMPONENTS
import CommunityList from "./CommunityList";
import CommunitySidebar from "./CommunitySidebar";

const CommunityLayout = () => {
  return (
    <div
      className="
        grid
        grid-cols-1
        xl:grid-cols-[1fr_380px]
        
        gap-8
        
        items-start
      "
    >
      
      {/* LEFT SIDE */}
      <div>
        <CommunityList />
      </div>

      {/* RIGHT SIDE */}
      <div
        className="
          xl:sticky
          xl:top-28
        "
      >
        <CommunitySidebar />
      </div>
    </div>
  );
};

export default CommunityLayout;