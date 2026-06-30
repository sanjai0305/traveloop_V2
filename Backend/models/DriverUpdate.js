import mongoose from "mongoose";

/**
 * DriverUpdate — stores driver announcements for a specific trip.
 * Only the assigned driver can create / delete entries.
 * Travelers and agents have read-only access.
 */
const driverUpdateSchema = new mongoose.Schema(
  {
    // Trip this update belongs to
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
      index: true,
    },

    // Driver who posted the update
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    driverName: {
      type: String,
      default: "Driver",
    },

    driverPhoto: {
      type: String,
      default: "",
    },

    // Update type for visual styling
    type: {
      type: String,
      enum: ["info", "alert", "delay", "location", "vehicle", "pickup", "arrival"],
      default: "info",
    },

    // Main message content
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Optional image attachment (base64 or URL)
    imageUrl: {
      type: String,
      default: "",
    },

    // Optional location data
    locationData: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: "" },
      mapsUrl: { type: String, default: "" },
    },

    // Whether driver has deleted this update
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast per-trip lookups
driverUpdateSchema.index({ trip: 1, createdAt: -1 });

const DriverUpdate = mongoose.model("DriverUpdate", driverUpdateSchema);
export default DriverUpdate;
