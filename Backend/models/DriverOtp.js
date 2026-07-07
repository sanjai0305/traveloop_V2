import mongoose from "mongoose";

const driverOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically remove expired documents
driverOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DriverOtp = mongoose.model("DriverOtp", driverOtpSchema);
export default DriverOtp;
