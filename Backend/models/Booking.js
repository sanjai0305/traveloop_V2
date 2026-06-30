import mongoose from "mongoose";
import Seat from "./Seat.js";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    // Backwards compatibility single-traveler fields
    travelerName: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
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
    seats: {
      type: Number,
      required: true,
      default: 1,
    },
    seatNumbers: [
      {
        type: String,
      }
    ],
    // Core payment/status fields
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Cancelled"],
      default: "Paid",
    },
    status: {
      type: String,
      default: "Paid",
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    // References
    agentTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
    },
    // Group travellers list
    travellers: [
      {
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
        phone: { type: String },
      }
    ],
    // Extended stats counts
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
    // Pricing
    pricePaid: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
    },
    // Traveler personal notes on this booking (editable by traveler)
    personalNotes: {
      type: String,
      default: "",
    },
    // ── Boarding (Driver Portal) ──────────────────────────────────
    boardingStatus: {
      type: String,
      enum: ["Pending", "Checked-In", "Boarded", "NoShow"],
      default: "Pending",
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    boardingPassGenerated: {
      type: Boolean,
      default: false,
    },
    boardingPassGeneratedAt: {
      type: Date,
      default: null,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    boarded: {
      type: Boolean,
      default: false,
    },
    seatAssigned: {
      type: Boolean,
      default: false,
    },
    boardingPass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BoardingPass",
    },
    qrCode: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      default: "",
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    qrToken: {
      type: String,
      default: "",
    },
    qrExpiry: {
      type: Date,
      default: null,
    },
    bookingStatus: {
      type: String,
      default: "confirmed",
    },
    paymentVerified: {
      type: Boolean,
      default: false,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    assignedSeat: {
      type: String,
      default: "",
    },
    boardedAt: {
      type: Date,
      default: null,
    },
    amountPaid: {
      type: Number,
    },
    commissionAmount: {
      type: Number,
    },
    agentAmount: {
      type: Number,
    },
    gatewayFee: {
      type: Number,
    },
    agentShare: {
      type: Number,
    },
    platformShare: {
      type: Number,
    },
    settlementStatus: {
      type: String,
      enum: ["Pending", "Paid", "Settled", "Failed"],
      default: "Pending",
    },
    refundStatus: {
      type: String,
      enum: ["requested", "approved", "rejected", null],
      default: null,
    },
    tripDeleted: {
      type: Boolean,
      default: false,
    },
    cancelReason: {
      type: String,
      default: "",
    },
    userTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    pickupLocation: {
      type: String,
      default: "",
    },
    dropLocation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

bookingSchema.virtual("boardingAvailable").get(function() {
  const tripObj = this.agentTrip || this.trip || this.tripId;
  if (tripObj && typeof tripObj === "object") {
    return tripObj.boardingStatus === "OPEN";
  }
  return false;
});

bookingSchema.pre("save", async function() {
  if (!this.trip) {
    this.trip = this.agentTrip || this.tripId;
  }
  if (this.agentTrip) {
    try {
      const AgentTripObj = await mongoose.model("AgentTrip").findById(this.agentTrip);
      if (AgentTripObj && AgentTripObj.driver) {
        this.driver = AgentTripObj.driver;
      }
    } catch (err) {
      console.warn("Could not auto-populate driver in booking pre-save hook:", err.message);
    }
  }
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

