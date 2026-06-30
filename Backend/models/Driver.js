import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    // Identity
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },

    // Vehicle & License
    licenseNumber: { type: String, default: "" },
    vehicleNumber:  { type: String, default: "" },
    photo:          { type: String, default: "" },   // URL or base64
    emergencyContact: { type: String, default: "" },

    // Account status
    status: {
      type: String,
      enum: ["pending_verification", "active", "suspended"],
      default: "pending_verification",
    },
    emailVerified: { type: Boolean, default: false },

    // OTP fields (email-based login)
    emailOtp:        { type: String, default: null },
    emailOtpExpiry:  { type: Date,   default: null },
    emailOtpAttempts: { type: Number, default: 0 },

    // Google sign-in UID
    googleUid: { type: String, default: null },

    // Relations
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
    assignedTrips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AgentTrip",
      },
    ],

    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;
