import React, {
  useState,
} from "react";

import {
  CalendarDays,
  MapPin,
  Plane,
  ClipboardList,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

// COMPONENTS
import InputField from "../common/InputField";
import SelectField from "../common/SelectField";
import Button from "../common/Button";
import { getApiUrl } from "../../utils/api";

const TripForm = () => {

  const navigate =
    useNavigate();

  // FORM STATE
  const [formData, setFormData] =
    useState({
      tripName: "",
      destination: "",
      startDate: "",
      endDate: "",
    });

  // ERROR STATE
  const [errors, setErrors] =
    useState({});

  // LOADING
  const [loading, setLoading] =
    useState(false);




  // DESTINATIONS
  const destinations = [
    "Bali, Indonesia",
    "Paris, France",
    "Santorini, Greece",
    "Dubai, UAE",
    "Maldives",
    "Switzerland",
    "Tokyo, Japan",
    "Goa, India",
  ];




  // HANDLE CHANGE
  const handleChange = (e) => {

    const { name, value } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };




  // VALIDATE
  const validateForm = () => {

    let newErrors = {};

    if (
      !formData.tripName.trim()
    ) {

      newErrors.tripName =
        "Trip name is required";
    }

    if (
      !formData.destination
    ) {

      newErrors.destination =
        "Please select a destination";
    }

    if (
      !formData.startDate
    ) {

      newErrors.startDate =
        "Start date is required";
    }

    if (
      !formData.endDate
    ) {

      newErrors.endDate =
        "End date is required";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };




  // HANDLE SUBMIT
  const handleSubmit = async (
    e
  ) => {

    e.preventDefault();

    if (
      !validateForm()
    ) return;

    try {

      setLoading(true);

      // TOKEN
      const token =
        localStorage.getItem(
          "token"
        );

      // API CALL
      const response =
        await fetch(
          getApiUrl("trips/create"),
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              title:
                formData.tripName,

              destination:
                formData.destination,

              startDate:
                formData.startDate,

              endDate:
                formData.endDate,

              budget: 50000,

              travelers: 1,

              description:
                "Trip created from frontend",
            }),
          }
        );

      const data =
        await response.json();

      // ERROR
      if (!response.ok) {

        alert(
          data.message
        );

        setLoading(false);

        return;
      }

      // SUCCESS
      alert(
        "Trip Created Successfully"
      );

      // RESET FORM
      setFormData({
        tripName: "",
        destination: "",
        startDate: "",
        endDate: "",
      });

      setLoading(false);

      // REDIRECT
      navigate("/my-trips");

    } catch (error) {

      console.log(error);

      alert(
        "Server Error"
      );

      setLoading(false);
    }
  };




  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="
        bg-white

        border
        border-slate-200

        rounded-[36px]

        shadow-sm

        overflow-hidden
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          items-center
          gap-3

          px-6
          md:px-8

          py-6

          border-b
          border-slate-100
        "
      >

        {/* ICON */}
        <div
          className="
            w-14
            h-14

            rounded-2xl

            bg-gradient-to-br
            from-teal-500
            to-cyan-500

            flex
            items-center
            justify-center

            text-white

            shadow-lg
          "
        >
          <ClipboardList
            size={26}
          />
        </div>



        {/* TEXT */}
        <div>
          <h2
            className="
              text-2xl

              font-bold

              text-slate-800
            "
          >
            Plan A New Trip
          </h2>

          <p
            className="
              mt-1

              text-slate-500
            "
          >
            Fill in your travel
            details below.
          </p>
        </div>
      </div>



      {/* FORM BODY */}
      <div
        className="
          p-6
          md:p-8

          space-y-7
        "
      >

        {/* TRIP NAME */}
        <InputField
          label="Trip Name"
          type="text"
          name="tripName"
          placeholder="
            Enter your trip name
          "
          icon={Plane}
          value={
            formData.tripName
          }
          onChange={
            handleChange
          }
          error={
            errors.tripName
          }
        />



        {/* DESTINATION */}
        <SelectField
          label="
            Select A Destination
          "
          name="destination"
          icon={MapPin}
          options={
            destinations
          }
          value={
            formData.destination
          }
          onChange={
            handleChange
          }
          error={
            errors.destination
          }
          placeholder="
            Search or select
            a destination
          "
        />



        {/* DATE ROW */}
        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2

            gap-6
          "
        >

          {/* START DATE */}
          <div>
            <label
              className="
                block
                mb-3

                text-sm
                md:text-base

                font-semibold

                text-slate-700
              "
            >
              Start Date
            </label>

            <div
              className="
                group

                flex
                items-center
                gap-4

                px-5
                py-4

                rounded-2xl

                border
                border-slate-200

                bg-white

                shadow-sm
              "
            >
              <CalendarDays
                size={22}
                className="
                  text-teal-500
                "
              />

              <input
                type="date"
                name="startDate"
                value={
                  formData.startDate
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  outline-none
                "
              />
            </div>

            {errors.startDate && (
              <p
                className="
                  mt-2
                  text-sm
                  text-red-500
                "
              >
                {
                  errors.startDate
                }
              </p>
            )}
          </div>



          {/* END DATE */}
          <div>
            <label
              className="
                block
                mb-3

                text-sm
                md:text-base

                font-semibold

                text-slate-700
              "
            >
              End Date
            </label>

            <div
              className="
                group

                flex
                items-center
                gap-4

                px-5
                py-4

                rounded-2xl

                border
                border-slate-200

                bg-white

                shadow-sm
              "
            >
              <CalendarDays
                size={22}
                className="
                  text-cyan-500
                "
              />

              <input
                type="date"
                name="endDate"
                value={
                  formData.endDate
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  outline-none
                "
              />
            </div>

            {errors.endDate && (
              <p
                className="
                  mt-2
                  text-sm
                  text-red-500
                "
              >
                {
                  errors.endDate
                }
              </p>
            )}
          </div>
        </div>



        {/* BUTTON */}
        <div
          className="
            flex
            justify-end
            pt-4
          "
        >
          <div
            className="
              w-full
              md:w-auto
            "
          >
            <Button
              type="submit"
              text="
                Create Trip
              "
              loading={
                loading
              }
              icon={Plane}
              className="
                md:px-10
              "
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default TripForm;