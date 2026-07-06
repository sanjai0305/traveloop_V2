import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    bookingRef: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["booking", "slot_purchase"],
      default: "booking",
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
    slotsGranted: {
      type: Number,
      default: 0,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: "razorpay",
    },
    gateway: {
      type: String,
      default: "razorpay",
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      set: v => v ? v.toUpperCase() : v
    },
    transactionId: {
      type: String,
      default: "",
    },
    orderId: {
      type: String,
      default: "",
    },
    paymentId: {
      type: String,
      default: "",
    },
    signature: {
      type: String,
      default: "",
    },
    upiReference: {
      type: String,
      default: "",
    },
    bankRRN: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
