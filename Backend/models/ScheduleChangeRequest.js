import mongoose from "mongoose";
import crypto from "crypto";

const passengerConsentSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    travelerName: { type: String, default: "" },
    email: { type: String, required: true },
    otpHash: { type: String, default: "" },       // bcrypt/sha256 hash of OTP
    otp: { type: String, default: "" },           // plain for dev; use hash in prod
    expiresAt: { type: Date, default: null },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "otp_sent", "approved", "rejected", "expired"],
      default: "pending",
    },
    otpSentAt: { type: Date, default: null },
  },
  { _id: false }
);

const scheduleChangeRequestSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    // New schedule values
    newStartDate: { type: String, required: true },
    newDepartureTime: { type: String, required: true },
    // Previous schedule values (for notification emails)
    oldStartDate: { type: String, default: "" },
    oldDepartureTime: { type: String, default: "" },
    // Overall request status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "applied", "cancelled"],
      default: "pending",
    },
    // Per-passenger consent list
    passengers: {
      type: [passengerConsentSchema],
      default: [],
    },
    totalPassengers: { type: Number, default: 0 },
    approvedCount: { type: Number, default: 0 },
    appliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

scheduleChangeRequestSchema.index({ tripId: 1, status: 1 });
scheduleChangeRequestSchema.index({ agentId: 1 });

// Helper: generate a 6-digit OTP
scheduleChangeRequestSchema.statics.generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// Helper: hash OTP (SHA-256 simple hash for lightweight verification)
scheduleChangeRequestSchema.statics.hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const ScheduleChangeRequest = mongoose.model(
  "ScheduleChangeRequest",
  scheduleChangeRequestSchema
);

export default ScheduleChangeRequest;
