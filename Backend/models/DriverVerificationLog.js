import mongoose from "mongoose";

const driverVerificationLogSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ["QR", "Ticket ID", "Manual"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

driverVerificationLogSchema.index({ driverId: 1 });
driverVerificationLogSchema.index({ bookingId: 1 });

const DriverVerificationLog = mongoose.model("DriverVerificationLog", driverVerificationLogSchema);
export default DriverVerificationLog;
