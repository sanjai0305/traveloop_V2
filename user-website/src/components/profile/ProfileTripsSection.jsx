// src/components/profile/ProfileTripsSection.jsx

import React from "react";

// COMPONENTS (FIXED PATHS)
import SectionHeader from "../dashboard/SectionHeader";
import TripCard from "../myTrips/MyTripCard";
import EmptyTripsState from "../myTrips/EmptyTripsState";

// IMAGES
import Maldives from "../../assets/images/maldives.jpg";
import Switzerland from "../../assets/images/swiss.jpg";
import Dubai from "../../assets/images/dubai.jpg";
import Bali from "../../assets/images/bali.jpg";
import Goa from "../../assets/images/goa.jpg";

const ProfileTripsSection = ({ type = "preplanned" }) => {
  
  // DATA
  const data = {
    preplanned: {
      title: "Preplanned Trips",
      subtitle: "Trips you have planned for upcoming adventures.",
      trips: [
        {
          id: 1,
          title: "Maldives Honeymoon Plan",
          location: "Maldives",
          image: Maldives,
          date: "Aug 2026",
        },
        {
          id: 2,
          title: "Swiss Alps Adventure",
          location: "Switzerland",
          image: Switzerland,
          date: "Sep 2026",
        },
        {
          id: 3,
          title: "Dubai Luxury Trip",
          location: "Dubai",
          image: Dubai,
          date: "Oct 2026",
        },
      ],
    },

    previous: {
      title: "Previous Trips",
      subtitle: "Your completed travel experiences.",
      trips: [
        {
          id: 4,
          title: "Bali Beach Escape",
          location: "Bali",
          image: Bali,
          date: "Jun 2025",
        },
        {
          id: 5,
          title: "Goa Weekend Trip",
          location: "Goa",
          image: Goa,
          date: "Mar 2025",
        },
      ],
    },
  };

  const section = data[type];

  return (
    <div>
      
      {/* HEADER */}
      <SectionHeader
        title={section.title}
        subtitle={section.subtitle}
        buttonText="View All"
      />

      {/* EMPTY STATE */}
      {section.trips.length === 0 ? (
        <EmptyTripsState />
      ) : (
        
        <div
          className="
            mt-6
            
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            
            gap-6
          "
        >
          {section.trips.map((trip) => (
            <TripCard
              key={trip.id}
              id={trip.id}
              image={trip.image}
              title={trip.title}
              destination={trip.location}
              date={trip.date}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileTripsSection;