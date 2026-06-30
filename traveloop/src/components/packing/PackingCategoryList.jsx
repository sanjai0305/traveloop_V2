// src/components/packing/PackingCategoryList.jsx

import React from "react";

// COMPONENTS
import PackingCategoryCard from "./PackingCategoryCard";

// IMAGES
import DocumentsIcon from "../../assets/images/documents-icon.png";
import ClothingIcon from "../../assets/images/clothing-icon.png";
import ElectronicsIcon from "../../assets/images/electronics-icon.png";

const packingCategories = [
  {
    id: 1,
    title: "Documents",
    description:
      "Keep all essential travel and identification documents ready.",
    icon: DocumentsIcon,

    items: [
      {
        id: 1,
        label: "Passport",
        packed: true,
      },

      {
        id: 2,
        label: "Flight Tickets",
        packed: true,
      },

      {
        id: 3,
        label: "Travel Insurance",
        packed: false,
      },
    ],
  },

  {
    id: 2,
    title: "Clothing",
    description:
      "Organize all outfits and clothing essentials for your trip.",
    icon: ClothingIcon,

    items: [
      {
        id: 4,
        label: "Jackets",
        packed: true,
      },

      {
        id: 5,
        label: "T-Shirts",
        packed: false,
      },

      {
        id: 6,
        label: "Shoes",
        packed: false,
      },
    ],
  },

  {
    id: 3,
    title: "Electronics",
    description:
      "Carry all important gadgets and charging accessories safely.",
    icon: ElectronicsIcon,

    items: [
      {
        id: 7,
        label: "Laptop",
        packed: true,
      },

      {
        id: 8,
        label: "Camera",
        packed: false,
      },

      {
        id: 9,
        label: "Chargers",
        packed: true,
      },
    ],
  },
];

const PackingCategoryList = () => {
  return (
    <div
      className="
        flex
        flex-col
        
        gap-8
      "
    >
      {packingCategories.map(
        (category) => (
          <PackingCategoryCard
            key={category.id}
            category={category}
          />
        )
      )}
    </div>
  );
};

export default PackingCategoryList;