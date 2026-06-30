import mongoose from "mongoose";

const flightSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    flightNumber: {
      type: String,
      required: true,
    },
    airline: {
      type: String,
      required: true,
    },
    departureAirport: {
      type: String,
      default: "",
    },
    arrivalAirport: {
      type: String,
      default: "",
    },
    departureTime: {
      type: Date,
      default: null,
    },
    arrivalTime: {
      type: Date,
      default: null,
    },
    terminal: {
      type: String,
      default: "",
    },
    gate: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["scheduled", "boarding", "delayed", "cancelled", "landed"],
      default: "scheduled",
    },
    delayMinutes: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Flight = mongoose.model("Flight", flightSchema);

export default Flight;
