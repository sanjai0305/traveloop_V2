// src/pages/AdminDashboard.jsx

import React from "react";

// LAYOUT
import MainLayout from "../layouts/MainLayout";

// COMPONENTS
import AdminHeader from "../components/admin/AdminHeader";
import AdminSearchBar from "../components/admin/AdminSearchBar";
import AdminFilterBar from "../components/admin/AdminFilterBar";
import AdminTabs from "../components/admin/AdminTabs";

import AdminOverviewCards from "../components/admin/AdminOverviewCards";

import UsersOverviewChart from "../components/admin/UsersOverviewChart";
import UserGrowthChart from "../components/admin/UserGrowthChart";

import TopCitiesChart from "../components/admin/TopCitiesChart";
import TopActivitiesChart from "../components/admin/TopActivitiesChart";

import AdminSidebar from "../components/admin/AdminSidebar";

const AdminDashboard = () => {
  return (
    <MainLayout>
      
      {/* HEADER */}
      <section>
        <AdminHeader />
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
            <AdminSearchBar />
          </div>

          {/* FILTER */}
          <AdminFilterBar />
        </div>

        {/* TABS */}
        <div className="mt-6">
          <AdminTabs />
        </div>
      </section>

      {/* MAIN GRID */}
      <section
        className="
          mt-10
          
          grid
          grid-cols-1
          2xl:grid-cols-[1fr_360px]
          
          gap-8
          
          items-start
        "
      >
        
        {/* LEFT SIDE */}
        <div>
          
          {/* OVERVIEW CARDS */}
          <AdminOverviewCards />

          {/* USERS OVERVIEW */}
          <div className="mt-8">
            <UsersOverviewChart />
          </div>

          {/* USER GROWTH */}
          <div className="mt-8">
            <UserGrowthChart />
          </div>

          {/* CHART GRID */}
          <div
            className="
              mt-8
              
              grid
              grid-cols-1
              xl:grid-cols-2
              
              gap-8
            "
          >
            <TopCitiesChart />

            <TopActivitiesChart />
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div
          className="
            2xl:sticky
            2xl:top-28
          "
        >
          <AdminSidebar />
        </div>
      </section>
    </MainLayout>
  );
};

export default AdminDashboard;