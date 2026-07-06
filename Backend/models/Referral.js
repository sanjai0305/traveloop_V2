import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      default: null,
    },
    discountApplied: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["registered", "booked", "completed"],
      default: "registered",
    },
    registered: {
      type: Boolean,
      default: true,
    },
    booked: {
      type: Boolean,
      default: false,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
