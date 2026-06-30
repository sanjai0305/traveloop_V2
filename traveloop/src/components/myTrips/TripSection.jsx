import React from "react";

// COMPONENTS
import SectionHeader from "../dashboard/SectionHeader";
import MyTripCard from "./MyTripCard";

const TripSection = ({
  trips,
}) => {

  return (
    <section>

      {/* HEADER */}
      <SectionHeader
        title="My Trips"
        subtitle="Manage your travel experiences."
        buttonText="View All"
      />



      {/* EMPTY */}
      {trips.length === 0 && (

        <div
          className="
            mt-10

            text-center

            text-2xl
            font-bold

            text-slate-400
          "
        >
          No Trips Found
        </div>
      )}



      {/* GRID */}
      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2

          gap-7
        "
      >

        {trips.map((trip) => (

          <MyTripCard
            key={trip._id}

            id={trip._id}

            title={trip.title}

            destination={
              trip.destination
            }

            date={
              trip.startDate
            }

            duration="5 Days"

            budget={`₹${trip.budget}`}

            progress={80}

            status="Upcoming"
          />
        ))}
      </div>
    </section>
  );
};

export default TripSection;