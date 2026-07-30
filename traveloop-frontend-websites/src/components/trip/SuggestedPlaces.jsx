// src/components/trip/SuggestedPlaces.jsx

import React from "react";

// COMPONENTS
import SectionHeader from "../dashboard/SectionHeader";
import SuggestionCard from "./SuggestionCard";

// IMAGES
import EiffelImage from "../../assets/images/eiffel.jpg";
import SantoriniImage from "../../assets/images/santorini.jpg";
import ZermattImage from "../../assets/images/zermatt.jpg";
import CuisineImage from "../../assets/images/cuisine.jpg";
import MuseumImage from "../../assets/images/museum.jpg";
import BaliTripImage from "../../assets/images/bali-trip.jpg";

const SuggestedPlaces = () => {
  
  // SUGGESTIONS DATA
  const suggestions = [
    {
      id: 1,
      title: "Eiffel Tower Tour",
      category: "Landmark",
      image: EiffelImage,
      rating: "4.9",
      location: "Paris, France",
    },

    {
      id: 2,
      title: "Santorini Sunset",
      category: "Beach",
      image: SantoriniImage,
      rating: "4.8",
      location: "Santorini, Greece",
    },

    {
      id: 3,
      title: "Zermatt Adventure",
      category: "Mountain",
      image: ZermattImage,
      rating: "4.9",
      location: "Switzerland",
    },

    {
      id: 4,
      title: "Luxury Cuisine",
      category: "Food",
      image: CuisineImage,
      rating: "4.7",
      location: "Italy",
    },

    {
      id: 5,
      title: "Historic Museum",
      category: "Culture",
      image: MuseumImage,
      rating: "4.8",
      location: "London, UK",
    },

    {
      id: 6,
      title: "Bali Beach Escape",
      category: "Relaxation",
      image: BaliTripImage,
      rating: "4.9",
      location: "Bali, Indonesia",
    },
  ];

  return (
    <section>
      
      {/* SECTION HEADER */}
      <SectionHeader
        title="Suggested Experiences"
        subtitle="Explore hand-picked destinations and activities for your upcoming trip."
        buttonText="View All"
      />

      {/* GRID */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-3
          
          gap-7
        "
      >
        {suggestions.map((item) => (
          <SuggestionCard
            key={item.id}
            image={item.image}
            title={item.title}
            category={item.category}
            rating={item.rating}
            location={item.location}
          />
        ))}
      </div>
    </section>
  );
};

export default SuggestedPlaces;