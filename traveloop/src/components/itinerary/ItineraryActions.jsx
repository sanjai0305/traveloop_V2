import React from "react";

import {
  ArrowLeft,
  Save,
  Plane,
  ClipboardList,
  FileText,
  Compass,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

const ItineraryActions = () => {

  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="bg-white border border-slate-200 rounded-[34px] p-6 shadow-sm space-y-6">

      {/* TOP */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5">

        <div className="flex items-center gap-4">

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-lg">
            <Plane size={28} className="rotate-[20deg]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Finalize Itinerary
            </h2>

            <p className="text-slate-500 mt-1">
              Continue planning your trip
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">

          {/* BACK */}
          <button
            onClick={() => navigate("/my-trips")}
            className="flex items-center justify-center gap-3 px-7 py-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold hover:border-teal-300 hover:text-teal-600 transition-all"
          >
            <ArrowLeft size={20} />
            My Trips
          </button>

          {/* SAVE */}
          <button
            onClick={() => alert("Itinerary Saved")}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition-all"
          >
            <Save size={20} />
            Save
          </button>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* CHECKLIST */}
        <button
          onClick={() =>
            navigate(`/packing-checklist/${id}`)
          }
          className="flex items-center gap-4 p-5 rounded-3xl border border-slate-200 bg-slate-50 hover:border-teal-400 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center">
            <ClipboardList size={24} />
          </div>

          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800">
              Packing Checklist
            </h3>

            <p className="text-sm text-slate-500">
              Manage travel items
            </p>
          </div>
        </button>

        {/* NOTES */}
        <button
          onClick={() =>
            navigate(`/trip-notes/${id}`)
          }
          className="flex items-center gap-4 p-5 rounded-3xl border border-slate-200 bg-slate-50 hover:border-cyan-400 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-white flex items-center justify-center">
            <FileText size={24} />
          </div>

          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800">
              Trip Notes
            </h3>

            <p className="text-sm text-slate-500">
              Save important notes
            </p>
          </div>
        </button>

        {/* ACTIVITIES */}
        <button
          onClick={() =>
            navigate(`/activities/${id}`)
          }
          className="flex items-center gap-4 p-5 rounded-3xl border border-slate-200 bg-slate-50 hover:border-orange-400 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center">
            <Compass size={24} />
          </div>

          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800">
              Activities
            </h3>

            <p className="text-sm text-slate-500">
              Explore adventures
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ItineraryActions;