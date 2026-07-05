import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

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
  const [activeTab, setActiveTab] = useState("Overview");
  const [commissionRate, setCommissionRate] = useState(10);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load default commission settings
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const res = await apiClient.get("/admin/commission");
        if (res.data && res.data.defaultCommissionRate !== undefined) {
          setCommissionRate(res.data.defaultCommissionRate);
        }
      } catch (err) {
        console.error("Failed to load global commission rate:", err);
      }
    };
    fetchCommission();
  }, []);

  const handleSaveCommission = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await apiClient.patch("/admin/commission", { rate: commissionRate });
      if (res.data.success) {
        setSuccessMsg(res.data.message || "Global commission settings updated successfully!");
      } else {
        setErrorMsg(res.data.message || "Failed to update commission settings.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Server error updating commission.");
    } finally {
      setSaving(false);
    }
  };

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
          <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </section>

      {activeTab === "Settings" ? (
        <section className="mt-10 grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="bg-white border border-slate-200 rounded-[36px] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Global Commission Configuration</h2>
            <p className="text-xs text-slate-500 mb-6 font-semibold">
              Set the default commission percentage charged to agencies per trip booking transaction. Changes apply globally to all future bookings.
            </p>

            <div className="space-y-6 max-w-xl">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Commission Rate</span>
                  <span className="text-base font-black text-teal-600">{commissionRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-450 font-bold mt-2">
                  <span>0% (Minimum)</span>
                  <span>15%</span>
                  <span>30% (Maximum)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {[2, 5, 10, 15, 20, 25, 30].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCommissionRate(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      commissionRate === val
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-transparent shadow-sm"
                        : "bg-white border-slate-200 text-slate-650 hover:border-teal-350 hover:text-teal-600"
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-500 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 text-xs font-bold">
                  {successMsg}
                </div>
              )}

              <button
                onClick={handleSaveCommission}
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm shadow-md hover:brightness-105 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="2xl:sticky 2xl:top-28">
            <AdminSidebar />
          </div>
        </section>
      ) : (
        /* MAIN GRID */
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
      )}
    </MainLayout>
  );
};

export default AdminDashboard;