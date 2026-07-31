// src/components/dashboard/PreviousTrips.jsx

import React from "react";
import TripCard from "./TripCard";

// IMAGES
import Trip1 from "../../assets/images/trip1.jpg";
import Trip2 from "../../assets/images/trip2.jpg";
import Trip3 from "../../assets/images/trip3.jpg";

const TRIPS = [
  { id: 1, image: Trip1, title: "Bali Summer Escape", country: "Indonesia", date: "12 Aug 2026", duration: "7 Days", progress: 85 },
  { id: 2, image: Trip2, title: "Swiss Mountain Adventure", country: "Switzerland", date: "25 Sep 2026", duration: "10 Days", progress: 60 },
  { id: 3, image: Trip3, title: "Dubai Luxury Tour", country: "UAE", date: "05 Nov 2026", duration: "5 Days", progress: 92 },
];

const PreviousTrips = () => {
  return (
    <div className="flex flex-col gap-3 stagger-children">
      {TRIPS.map((trip) => (
        <TripCard
          key={trip.id}
          image={trip.image}
          title={trip.title}
          country={trip.country}
          date={trip.date}
          duration={trip.duration}
          progress={trip.progress}
        />
      ))}
    </div>
  );
};

export default PreviousTrips;