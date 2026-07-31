// src/pages/Community.jsx

import React from "react";

// LAYOUT
import MainLayout from "../layouts/MainLayout";

// COMPONENTS
import CommunityHeader from "../components/community/CommunityHeader";
import CommunitySearchBar from "../components/community/CommunitySearchBar";
import CommunityFilterBar from "../components/community/CommunityFilterBar";
import CommunityLayout from "../components/community/CommunityLayout";

const Community = () => {
  return (
    <MainLayout>
      
      {/* HEADER */}
      <section>
        <CommunityHeader />
      </section>

      {/* SEARCH + FILTER */}
      <section
        className="
          mt-8
          
          bg-white
          
          border
          border-slate-200
          
          rounded-[36px]
          
          shadow-sm
          
          p-5
          md:p-6
        "
      >
        
        {/* SEARCH + FILTER BAR */}
        <div
          className="
            flex
            flex-col
            xl:flex-row
            
            gap-5
          "
        >
          
          {/* SEARCH */}
          <div className="flex-1">
            <CommunitySearchBar />
          </div>

          {/* FILTER */}
          <CommunityFilterBar />
        </div>
      </section>

      {/* MAIN COMMUNITY LAYOUT */}
      <section className="mt-10 pb-28">
        <CommunityLayout />
      </section>

    </MainLayout>
  );
};

export default Community;