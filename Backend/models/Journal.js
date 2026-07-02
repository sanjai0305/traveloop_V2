import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
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
      default: 1,
    },
    date: {
      type: Date,
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    photos: {
      type: [String],
      default: [],
    },
    mood: {
      type: String,
      default: "great",
    },
    highlights: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip and tripId in sync before saving
journalSchema.pre("save", function (next) {
  const targetTripId = this.tripId || this.trip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.trip = targetTripId;
  }
  next();
});

journalSchema.index({ tripId: 1 });

const Journal = mongoose.model("Journal", journalSchema);
export default Journal;
