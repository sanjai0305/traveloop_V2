import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
    vehicleNumber: {
      type: String,
      default: "",
    },
    licenseNumber: {
      type: String,
      default: "",
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },
    activeBoardingTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;
