import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Pending", // e.g. Pending, Settled
    },
    settledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

settlementSchema.index({ bookingId: 1 });
settlementSchema.index({ agentId: 1 });

const Settlement = mongoose.model("Settlement", settlementSchema);
export default Settlement;
