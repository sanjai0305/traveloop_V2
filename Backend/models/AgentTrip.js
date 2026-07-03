import mongoose from "mongoose";

const agentTripSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    firebaseUid: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "",
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    destinations: {
      type: [String],
      default: [],
    },
    duration: {
      type: String,
      default: "",
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    departureTime: {
      type: String,
      default: "",
    },
    arrivalTime: {
      type: String,
      default: "",
    },
    pickupLocation: {
      type: String,
      default: "",
    },
    busType: {
      type: String,
      default: "",
    },
    busNumber: {
      type: String,
      default: "",
    },
    busImages: {
      type: [String],
      default: [],
    },
    gallery: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default: "",
    },
    driverName: {
      type: String,
      default: "",
    },
    driverPhone: {
      type: String,
      default: "",
    },
    originalPrice: {
      type: Number,
      default: 0.00,
    },
    offerPrice: {
      type: Number,
      default: 0.00,
    },
    status: {
      type: String,
      default: "published",
    },
    boardingStatus: {
      type: String,
      default: "CLOSED",
    },
    boardingOpenedAt: {
      type: Date,
      default: null,
    },
    boardingClosesAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

agentTripSchema.index({ agentId: 1 });
agentTripSchema.index({ driverId: 1 });

const AgentTrip = mongoose.model("AgentTrip", agentTripSchema);
export default AgentTrip;
