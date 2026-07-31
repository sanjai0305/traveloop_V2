import React from "react";

import EmptyNotesState from "./EmptyNotesState";



// SAMPLE DATA
const notesData = [
  {
    id: 1,

    title: "Hotel Booking Notes",

    description:
      "Remember to confirm check-in timing and airport pickup service before arrival.",

    category: "Hotel",

    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  },

  {
    id: 2,

    title: "Food Places To Visit",

    description:
      "Try local street food markets and seafood restaurants during the trip.",

    category: "Food",

    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  },

  {
    id: 3,

    title: "Adventure Activities",

    description:
      "Book scuba diving and hiking activities at least 2 weeks early.",

    category: "Activities",

    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },

  {
    id: 4,

    title: "Transport Planning",

    description:
      "Keep backup cab contacts and local transport details saved offline.",

    category: "Transport",

    image:
      "https://images.unsplash.com/photo-1493238792000-8113da705763",
  },
];



const NotesList = () => {

  // EMPTY STATE
  if (!notesData.length) {

    return <EmptyNotesState />;
  }



  return (
    <div
      className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-3
        gap-6
      "
    >

      {notesData.map((note) => (
        <div
          key={note.id}
          className="
            bg-white

            rounded-3xl

            overflow-hidden

            border
            border-slate-200

            shadow-sm

            hover:shadow-xl

            transition-all
            duration-300
          "
        >

          {/* IMAGE */}
          <img
            src={note.image}
            alt={note.title}
            className="
              w-full
              h-52

              object-cover
            "
          />



          {/* CONTENT */}
          <div className="p-6">

            {/* CATEGORY */}
            <span
              className="
                inline-block

                px-4
                py-1.5

                rounded-full

                text-xs
                font-semibold

                bg-teal-100
                text-teal-700
              "
            >
              {note.category}
            </span>



            {/* TITLE */}
            <h2
              className="
                mt-4

                text-xl

                font-bold

                text-slate-800
              "
            >
              {note.title}
            </h2>



            {/* DESCRIPTION */}
            <p
              className="
                mt-3

                text-slate-500

                leading-7
              "
            >
              {note.description}
            </p>



            {/* BUTTON */}
            <button
              className="
                mt-6

                px-5
                py-3

                rounded-2xl

                bg-gradient-to-r
                from-teal-500
                to-cyan-500

                text-white
                font-semibold

                hover:scale-105

                transition-all
                duration-300
              "
            >
              View Note
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesList;