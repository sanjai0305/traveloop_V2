// src/components/dashboard/DestinationList.jsx

import React from "react";

// COMPONENTS
import DestinationCard from "./DestinationCard";

// IMAGES
import IndiaImage from "../../assets/images/india.jpg";
import MaldivesImage from "../../assets/images/maldives.jpg";
import UAEImage from "../../assets/images/uae.jpg";
import SwitzerlandImage from "../../assets/images/switzerland.jpg";
import BaliImage from "../../assets/images/bali.jpg";

const DESTINATIONS = [
  { id: 1, title: "Goa Beaches", country: "India", image: IndiaImage, rating: "4.9", places: "180+ Places" },
  { id: 2, title: "Maldives Escape", country: "Maldives", image: MaldivesImage, rating: "4.8", places: "95+ Resorts" },
  { id: 3, title: "Dubai Luxury", country: "UAE", image: UAEImage, rating: "4.7", places: "140+ Attractions" },
  { id: 4, title: "Swiss Alps", country: "Switzerland", image: SwitzerlandImage, rating: "4.9", places: "120+ Adventures" },
  { id: 5, title: "Bali Paradise", country: "Indonesia", image: BaliImage, rating: "4.8", places: "160+ Experiences" },
];

const DestinationList = ({ searchValue = "" }) => {
  const filtered = DESTINATIONS.filter(
    (d) =>
      d.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      d.country.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-slate-400">
        <span className="text-4xl mb-3">🔍</span>
        <p className="font-medium">No destinations found</p>
        <p className="text-sm mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 stagger-children">
      {filtered.map((destination) => (
        <DestinationCard
          key={destination.id}
          image={destination.image}
          title={destination.title}
          country={destination.country}
          rating={destination.rating}
          places={destination.places}
        />
      ))}
    </div>
  );
};

export default DestinationList;