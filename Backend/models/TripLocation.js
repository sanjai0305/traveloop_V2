import mongoose from "mongoose";

const tripLocationSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
      default: "",
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      default: 0, // km/h
    },
    heading: {
      type: Number,
      default: 0, // degrees
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: String,
      default: "15m", // "15m", "1h", "always"
    },
    expiresAt: {
      type: Date,
      required: true,
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

tripLocationSchema.index({ tripId: 1, userId: 1 }, { unique: true });
tripLocationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto cleanup expired locations

const TripLocation = mongoose.model("TripLocation", tripLocationSchema);
export default TripLocation;
