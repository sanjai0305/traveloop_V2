import React from "react";

const SectionList = ({
  sections,
}) => {

  return (

    <div className="space-y-5">

      {sections.map(
        (
          section,
          index
        ) => (

          <div
            key={index}

            className="
              p-6

              rounded-2xl

              border
            "
          >

            <h2 className="text-2xl font-bold">
              Day {section.day}
            </h2>

            <div className="mt-6 space-y-4">

  {/* ACTIVITY */}
  <div>

    <label
      className="
        text-sm
        font-semibold
        text-slate-500
      "
    >
      Activity
    </label>

    <input
      type="text"

      value={
        section.activity || ""
      }

      onChange={(e) =>
        handleChange(
          index,
          "activity",
          e.target.value
        )
      }

      placeholder="
Beach Visit
      "

      className="
        mt-2

        w-full

        rounded-2xl

        border
        border-slate-200

        px-5
        py-4

        outline-none

        focus:border-teal-400
      "
    />
  </div>



  {/* TIME */}
  <div>

    <label
      className="
        text-sm
        font-semibold
        text-slate-500
      "
    >
      Time
    </label>

    <input
      type="time"

      value={
        section.time || ""
      }

      onChange={(e) =>
        handleChange(
          index,
          "time",
          e.target.value
        )
      }

      className="
        mt-2

        w-full

        rounded-2xl

        border
        border-slate-200

        px-5
        py-4

        outline-none

        focus:border-teal-400
      "
    />
  </div>



  {/* LOCATION */}
  <div>

    <label
      className="
        text-sm
        font-semibold
        text-slate-500
      "
    >
      Location
    </label>

    <input
      type="text"

      value={
        section.place
      }

      onChange={(e) =>
        handleChange(
          index,
          "place",
          e.target.value
        )
      }

      placeholder="
Goa Beach
      "

      className="
        mt-2

        w-full

        rounded-2xl

        border
        border-slate-200

        px-5
        py-4

        outline-none

        focus:border-teal-400
      "
    />
  </div>



  {/* NOTES */}
  <div>

    <label
      className="
        text-sm
        font-semibold
        text-slate-500
      "
    >
      Notes
    </label>

    <textarea
      rows={4}

      value={
        section.notes || ""
      }

      onChange={(e) =>
        handleChange(
          index,
          "notes",
          e.target.value
        )
      }

      placeholder="
Carry sunscreen and camera
      "

      className="
        mt-2

        w-full

        rounded-2xl

        border
        border-slate-200

        bg-slate-50

        p-5

        outline-none

        resize-none

        focus:border-teal-400
      "
    />
  </div>
</div>
          </div>
        )
      )}
    </div>
  );
};

export default SectionList;