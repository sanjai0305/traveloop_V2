// src/components/community/CommunityList.jsx

import React from "react";

// COMPONENTS
import CommunityCard from "./CommunityCard";
import EmptyCommunityState from "./EmptyCommunityState";

// IMAGES
import AdventureCommunity from "../../assets/images/adventure-community.png";
import PhotographyCommunity from "../../assets/images/photography-community.png";
import BackpackerCommunity from "../../assets/images/backpacker-community.png";
import SoloCommunity from "../../assets/images/solo-community.png";

// MEMBERS
import Member1 from "../../assets/images/member1.jpg";
import Member2 from "../../assets/images/member2.jpg";
import Member3 from "../../assets/images/member3.jpg";
import Member4 from "../../assets/images/member4.jpg";

const communities = [
  {
    id: 1,
    image: AdventureCommunity,
    title: "Adventure Seekers",
    description:
      "Join thrill-seekers exploring mountains, hiking trails, and extreme adventures worldwide.",
    members: "120K+",
    posts: "18K+",
    tags: [
      "Adventure",
      "Hiking",
      "Mountains",
    ],
    memberImages: [
      Member1,
      Member2,
      Member3,
      Member4,
    ],
  },

  {
    id: 2,
    image: PhotographyCommunity,
    title: "Travel Photography",
    description:
      "Share breathtaking travel photos, cinematic landscapes, and creative visual storytelling.",
    members: "85K+",
    posts: "12K+",
    tags: [
      "Photography",
      "Creative",
      "Travel",
    ],
    memberImages: [
      Member2,
      Member3,
      Member4,
      Member1,
    ],
  },

  {
    id: 3,
    image: BackpackerCommunity,
    title: "Backpacker Diaries",
    description:
      "Discover budget travel tips, backpacking routes, hostels, and solo travel experiences.",
    members: "64K+",
    posts: "9K+",
    tags: [
      "Backpacking",
      "Budget",
      "Hostels",
    ],
    memberImages: [
      Member3,
      Member4,
      Member1,
      Member2,
    ],
  },

  {
    id: 4,
    image: SoloCommunity,
    title: "Solo Travelers Hub",
    description:
      "Connect with independent explorers and discover safe solo travel recommendations.",
    members: "52K+",
    posts: "7K+",
    tags: [
      "Solo Travel",
      "Explore",
      "Lifestyle",
    ],
    memberImages: [
      Member4,
      Member1,
      Member2,
      Member3,
    ],
  },
];

const CommunityList = () => {
  return (
    <div>
      
      {/* EMPTY */}
      {communities.length === 0 ? (
        <EmptyCommunityState />
      ) : (
        
        <div
          className="
            flex
            flex-col
            
            gap-8
          "
        >
          {communities.map(
            (community) => (
              <CommunityCard
                key={community.id}
                community={community}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityList;