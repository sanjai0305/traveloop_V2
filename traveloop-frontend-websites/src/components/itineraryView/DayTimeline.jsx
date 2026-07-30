// src/components/itineraryView/DayTimeline.jsx

import React from "react";

// COMPONENTS
import DayCard from "./DayCard";
import TimelineConnector from "./TimelineConnector";

// IMAGES
import TrainImage from "../../assets/images/train.jpg";
import HotelImage from "../../assets/images/hotel.jpg";
import HikingImage from "../../assets/images/hiking.jpg";
import RestaurantImage from "../../assets/images/restaurant.jpg";
import ShoppingImage from "../../assets/images/shopping.jpg";

const timelineData = [
  {
    id: 1,
    day: "Day 1",
    date: "10 May 2026",
    title: "Arrival & Hotel Check-In",
    description:
      "Arrive in Switzerland and settle into your luxury hotel before exploring the city center.",
    activities: [
      {
        id: 1,
        type: "Transport",
        title: "Airport Train Transfer",
        time: "09:00 AM",
        image: TrainImage,
        price: "₹4,500",
      },

      {
        id: 2,
        type: "Hotel",
        title: "Hotel Check-In",
        time: "12:30 PM",
        image: HotelImage,
        price: "₹18,000",
      },
    ],
  },

  {
    id: 2,
    day: "Day 2",
    date: "11 May 2026",
    title: "Adventure Activities",
    description:
      "Spend the day exploring mountains, hiking trails, and breathtaking scenic landscapes.",
    activities: [
      {
        id: 3,
        type: "Adventure",
        title: "Mountain Hiking",
        time: "08:00 AM",
        image: HikingImage,
        price: "₹6,000",
      },

      {
        id: 4,
        type: "Food",
        title: "Swiss Fine Dining",
        time: "07:30 PM",
        image: RestaurantImage,
        price: "₹5,500",
      },
    ],
  },

  {
    id: 3,
    day: "Day 3",
    date: "12 May 2026",
    title: "Relax & Shopping",
    description:
      "Relax and enjoy shopping experiences before ending your unforgettable journey.",
    activities: [
      {
        id: 5,
        type: "Shopping",
        title: "Luxury Shopping Tour",
        time: "11:00 AM",
        image: ShoppingImage,
        price: "₹12,000",
      },
    ],
  },
];

const DayTimeline = () => {
  return (
    <div
      className="
        relative
        
        flex
        flex-col
        
        gap-10
      "
    >
      {timelineData.map(
        (item, index) => (
          <div
            key={item.id}
            className="relative"
          >
            
            {/* DAY CARD */}
            <DayCard
              item={item}
            />

            {/* CONNECTOR */}
            {index !==
              timelineData.length -
                1 && (
              <TimelineConnector />
            )}
          </div>
        )
      )}
    </div>
  );
};

export default DayTimeline;