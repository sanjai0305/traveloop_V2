import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema(
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
    day: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "",
    },
    place: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    budget: {
      type: Number,
      default: 0,
    },
    isAiSuggestion: {
      type: Boolean,
      default: false,
    },
    aiSource: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip/tripId and description/note in sync before saving
itinerarySchema.pre("save", function () {
  const targetTripId = this.tripId || this.trip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.trip = targetTripId;
  }
  const desc = this.description || this.note;
  if (desc) {
    this.description = desc;
    this.note = desc;
  }
});

itinerarySchema.index({ tripId: 1 });

const Itinerary = mongoose.model("Itinerary", itinerarySchema);
export default Itinerary;