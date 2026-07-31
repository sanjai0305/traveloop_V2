import React from "react";

import {
  CalendarDays,
  Clock3,
  IndianRupee,
  MapPin,
  ArrowRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

// COMPONENTS
import TripProgressBar from "./TripProgressBar";
import TripStatusBadge from "./TripStatusBadge";
import TripCardMenu from "./TripCardMenu";

const MyTripCard = ({
  id,
  image,
  title,
  destination,
  date,
  duration,
  budget,
  progress,
  status,
}) => {

  const navigate =
    useNavigate();

  return (
    <div
      className="
        group
        relative

        overflow-hidden

        rounded-[34px]

        bg-white

        border
        border-slate-200

        shadow-sm

        hover:shadow-2xl

        transition-all
        duration-500

        hover:-translate-y-2
      "
    >

      {/* IMAGE SECTION */}
      <div
        className="
          relative

          h-[280px]

          overflow-hidden
        "
      >

        {/* IMAGE */}
        <div
          className="
            w-full
            h-full

            bg-gradient-to-br
            from-teal-400
            to-cyan-500

            flex
            items-center
            justify-center

            text-white
            text-3xl
            font-bold
          "
        >
          {destination}
        </div>

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0

            bg-gradient-to-t
            from-black/80
            via-black/10
            to-transparent
          "
        />

        {/* STATUS BADGE */}
        <div
          className="
            absolute
            top-5
            left-5
          "
        >
          <TripStatusBadge
            status={status}
          />
        </div>

        {/* MENU */}
        <div
          className="
            absolute
            top-5
            right-5
          "
        >
          <TripCardMenu />
        </div>

        {/* DESTINATION */}
        <div
          className="
            absolute
            bottom-5
            left-5

            flex
            items-center
            gap-2

            px-4
            py-2

            rounded-full

            bg-white/15
            backdrop-blur-xl

            border
            border-white/20

            text-white

            text-sm

            font-semibold
          "
        >
          <MapPin size={16} />

          <span>{destination}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">

        {/* TITLE */}
        <h2
          className="
            text-2xl
            md:text-3xl

            font-bold

            text-slate-800

            leading-tight
          "
        >
          {title}
        </h2>

        {/* DETAILS */}
        <div
          className="
            mt-6

            grid
            grid-cols-1
            sm:grid-cols-3

            gap-5
          "
        >

          {/* DATE */}
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                w-12
                h-12

                rounded-2xl

                bg-teal-50

                flex
                items-center
                justify-center

                text-teal-600
              "
            >
              <CalendarDays size={20} />
            </div>

            <div>
              <p
                className="
                  text-xs

                  text-slate-400
                "
              >
                Date
              </p>

              <h4
                className="
                  mt-1

                  text-sm

                  font-semibold

                  text-slate-700
                "
              >
                {date}
              </h4>
            </div>
          </div>

          {/* DURATION */}
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                w-12
                h-12

                rounded-2xl

                bg-cyan-50

                flex
                items-center
                justify-center

                text-cyan-600
              "
            >
              <Clock3 size={20} />
            </div>

            <div>
              <p
                className="
                  text-xs

                  text-slate-400
                "
              >
                Duration
              </p>

              <h4
                className="
                  mt-1

                  text-sm

                  font-semibold

                  text-slate-700
                "
              >
                {duration}
              </h4>
            </div>
          </div>

          {/* BUDGET */}
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                w-12
                h-12

                rounded-2xl

                bg-orange-50

                flex
                items-center
                justify-center

                text-orange-500
              "
            >
              <IndianRupee size={20} />
            </div>

            <div>
              <p
                className="
                  text-xs

                  text-slate-400
                "
              >
                Budget
              </p>

              <h4
                className="
                  mt-1

                  text-sm

                  font-semibold

                  text-slate-700
                "
              >
                {budget}
              </h4>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-7">
          <TripProgressBar
            progress={progress}
          />
        </div>

        {/* FOOTER */}
        <div
          className="
            mt-8

            flex
            items-center
            justify-between
          "
        >

          {/* STATUS TEXT */}
          <div>
            <p
              className="
                text-xs

                text-slate-400
              "
            >
              Current Status
            </p>

            <h4
              className="
                mt-1

                text-base

                font-bold

                text-teal-600
              "
            >
              {status}
            </h4>
          </div>

          {/* BUTTON */}
          <button
            onClick={() =>
              navigate(
                `/build-itinerary/${id}`
              )
            }
            className="
              group/button

              flex
              items-center
              gap-2

              px-6
              py-4

              rounded-2xl

              bg-gradient-to-r
              from-teal-500
              to-cyan-500

              text-white

              text-sm

              font-semibold

              shadow-[0_15px_35px_rgba(6,182,212,0.35)]

              hover:scale-[1.03]

              transition-all
              duration-300
            "
          >
            <span>
              View Details
            </span>

            <ArrowRight
              size={18}
              className="
                transition-transform
                duration-300

                group-hover/button:translate-x-1
              "
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTripCard;