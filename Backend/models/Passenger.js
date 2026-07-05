import crypto from "crypto";
import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema(
  {
    passengerId: {
      type: String,
      unique: true,
      default: () => `PSG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    bookingRef: {
      type: String,
      default: "",
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    emergencyContact: {
      type: String,
      default: "",
    },
    seatNumber: {
      type: String,
      required: true,
    },
    seatPreference: {
      type: String,
      enum: ["Window", "Aisle", "No Preference"],
      default: "No Preference",
    },
    specialRequest: {
      type: String,
      default: "",
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "no_show"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
    // Base64 or URL of the generated QR code
    qrCode: {
      type: String,
      default: "",
    },
    // JSON payload encoded in QR
    qrPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    boardedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

passengerSchema.index({ bookingId: 1 });
passengerSchema.index({ tripId: 1 });
passengerSchema.index({ seatNumber: 1, tripId: 1 });

const Passenger = mongoose.model("Passenger", passengerSchema);
export default Passenger;
