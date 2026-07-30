import React from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  FileText,
  Compass,
  Save,
} from "lucide-react";

const PackingActionButtons = () => {

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  return (
    <div className="bg-white border border-slate-200 rounded-[36px] shadow-sm p-6 space-y-6">

      {/* TEXT */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Manage Checklist
        </h2>

        <p className="mt-2 text-slate-500">
          Continue your trip planning flow
        </p>
      </div>

      {/* BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* BACK */}
        <button
          onClick={() =>
            navigate(`/build-itinerary/${id}`)
          }
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all"
        >
          <ArrowLeft size={20} />
          Itinerary
        </button>

        {/* SAVE */}
        <button
          onClick={() =>
            alert("Checklist Saved")
          }
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-teal-500 text-white hover:bg-teal-600 transition-all"
        >
          <Save size={20} />
          Save
        </button>

        {/* NOTES */}
        <button
          onClick={() =>
            navigate(`/trip-notes/${id}`)
          }
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-cyan-500 text-white hover:bg-cyan-600 transition-all"
        >
          <FileText size={20} />
          Notes
        </button>

        {/* ACTIVITIES */}
        <button
          onClick={() =>
            navigate(`/activities/${id}`)
          }
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-orange-500 text-white hover:bg-orange-600 transition-all"
        >
          <Compass size={20} />
          Activities
        </button>
      </div>
    </div>
  );
};

export default PackingActionButtons;