import crypto from "crypto";
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
    seats: {
      type: Number,
      default: 1,
    },
    seatNumbers: {
      type: [String],
      default: [],
    },
    pricePaid: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      set: v => v ? v.toUpperCase() : v
    },
    status: {
      type: String,
      default: "Paid",
    },
    bookingStatus: {
      type: String,
      default: "confirmed",
    },
    boardingStatus: {
      type: String,
      enum: ["LOCKED", "OPEN", "BOARDED", "CLOSED", "NO_SHOW"],
      default: "LOCKED",
      set: v => v ? v.toUpperCase() : v
    },
    paymentVerified: {
      type: Boolean,
      default: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    assignedSeat: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomUUID(),
    },
    travelerName: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    contactNumber: {
      type: String,
      default: "",
    },
    age: {
      type: Number,
      default: 0,
    },
    travellers: [
      {
        name: { type: String },
        age: { type: Number },
        gender: { type: String },
        phone: { type: String },
        email: { type: String },
      }
    ],
    maleCount: {
      type: Number,
      default: 0,
    },
    femaleCount: {
      type: Number,
      default: 0,
    },
    adults: {
      type: Number,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    gatewayFee: {
      type: Number,
      default: 0,
    },
    agentAmount: {
      type: Number,
      default: 0,
    },
    pickupLocation: {
      type: String,
      default: "",
    },
    referralApplied: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      default: "",
    },
    referralDiscountPercent: {
      type: Number,
      default: 0,
    },
    referralDiscountAmount: {
      type: Number,
      default: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    qrCode: {
      type: String,
      default: "",
    },
    boardedAt: {
      type: Date,
      default: null,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    emergencyContact: {
      type: String,
      default: "",
    },
    qrUnlocked: {
      type: Boolean,
      default: false,
    },
    boardingUnlockedAt: {
      type: Date,
    },
    boardingUnlockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    boardingWindowOpen: {
      type: Boolean,
      default: false,
    },
    boardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    seatNumber: {
      type: String,
    },
    refundStatus: {
      type: String,
      default: "",
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    adminCommission: {
      type: Number,
      default: 0,
    },
    bookingAmount: {
      type: Number,
      default: 0,
    },
    passengers: [
      {
        name: String,
        age: Number,
        gender: String,
      }
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Define agentTrip virtual for backward compatibility with UI/legacy code
bookingSchema.virtual("agentTrip").get(function () {
  return this.tripId;
}).set(function (value) {
  this.tripId = value;
});

// Define agent virtual for backward compatibility
bookingSchema.virtual("agent").get(function () {
  return this.agentId;
}).set(function (value) {
  this.agentId = value;
});

bookingSchema.index({ userId: 1 });
bookingSchema.index({ tripId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

