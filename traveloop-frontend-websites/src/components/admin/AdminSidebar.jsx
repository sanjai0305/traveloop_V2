// src/components/admin/AdminSidebar.jsx

import React from "react";

// COMPONENTS
import AdminInfoCard from "./AdminInfoCard";
import AdminFeatureList from "./AdminFeatureList";
import RevenueCard from "./RevenueCard";

const AdminSidebar = () => {
  return (
    <div
      className="
        flex
        flex-col
        
        gap-6
      "
    >
      
      {/* ADMIN INFO */}
      <AdminInfoCard />

      {/* REVENUE */}
      <RevenueCard />

      {/* FEATURES */}
      <AdminFeatureList />
    </div>
  );
};

export default AdminSidebar;