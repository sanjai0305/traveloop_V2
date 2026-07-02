import mongoose from "mongoose";

const flightSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
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
      default: "scheduled",
    },
    delayMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip and tripId in sync before saving
flightSchema.pre("save", function (next) {
  const targetTripId = this.tripId || this.trip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.trip = targetTripId;
  }
  next();
});

flightSchema.index({ tripId: 1 });

const Flight = mongoose.model("Flight", flightSchema);
export default Flight;
