import React from "react";

const AddSectionButton = ({
  sections,
  setSections,
}) => {

  const handleAdd = () => {

    setSections([
      ...sections,
      {
        day:
          sections.length + 1,

        title:
          `New Day ${
            sections.length + 1
          }`,

        activities: "",

        budget: 5000,

        place:
          "New Destination",
      },
    ]);
  };

  return (

    <button
      type="button"
      onClick={handleAdd}
      className="
        px-6
        py-4

        rounded-2xl

        bg-teal-500

        text-white

        font-bold
      "
    >
      Add Section
    </button>
  );
};

export default AddSectionButton;