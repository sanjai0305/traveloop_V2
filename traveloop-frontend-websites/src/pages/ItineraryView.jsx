// src/pages/ItineraryView.jsx

import React from "react";

// LAYOUT
import MainLayout from "../layouts/MainLayout";

// COMPONENTS
import ItineraryViewHeader from "../components/itineraryView/ItineraryViewHeader";
import ItinerarySearchBar from "../components/itineraryView/ItinerarySearchBar";
import ItineraryFilterBar from "../components/itineraryView/ItineraryFilterBar";
import BudgetCard from "../components/itineraryView/BudgetCard";
import DayTimeline from "../components/itineraryView/DayTimeline";
import ItineraryFooter from "../components/itineraryView/ItineraryFooter";

const ItineraryView = () => {
  return (
    <MainLayout>
      
      {/* HEADER */}
      <section>
        <ItineraryViewHeader />
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
        
        {/* SEARCH */}
        <div>
          <ItinerarySearchBar />
        </div>

        {/* FILTER */}
        <div className="mt-5">
          <ItineraryFilterBar />
        </div>
      </section>

      {/* BUDGET CARD */}
      <section className="mt-10">
        <BudgetCard />
      </section>

      {/* TIMELINE */}
      <section className="mt-10">
        <DayTimeline />
      </section>

      {/* FOOTER */}
      <section className="mt-10 pb-28">
        <ItineraryFooter />
      </section>

    </MainLayout>
  );
};

export default ItineraryView;