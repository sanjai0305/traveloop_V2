import mongoose from "mongoose";

const seatBookingSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    // Row index (A, B, C…) and column (1, 2, 3…) for layout rendering
    row: {
      type: String,
      default: "",
    },
    col: {
      type: Number,
      default: 0,
    },
    // Which booking owns this seat (null when available)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      default: null,
    },
    // Passenger snapshot for quick reads (avoids populate)
    passengerName: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
    age: {
      type: Number,
      default: 0,
    },
    /**
     * available  — nobody holding this seat
     * reserved   — user is in seat-selection/payment flow (Redis TTL lock)
     * booked     — payment completed, seat permanently taken
     */
    status: {
      type: String,
      enum: ["available", "reserved", "booked", "AVAILABLE", "LOCKED", "BOOKED", "locked"],
      default: "available",
      set: v => v ? v.toLowerCase() : v
    },
    paymentStatus: {
      type: String,
      enum: ["none", "pending", "completed", "NONE", "PENDING", "COMPLETED"],
      default: "none",
      set: v => v ? v.toLowerCase() : v
    },
    /**
     * ISO timestamp when the Redis reservation expires.
     * Backend uses this as ground-truth fallback if Redis is unavailable.
     */
    reservedUntil: {
      type: Date,
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
    // userId who placed the temporary reservation (for ownership checks)
    reservedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isLower: {
      type: Boolean,
      default: true, // true = lower berth, false = upper berth (for sleeper buses)
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Alias lockExpiresAt and reservedUntil
seatBookingSchema.virtual("lockExpires").get(function() {
  return this.lockExpiresAt || this.reservedUntil;
}).set(function(val) {
  this.lockExpiresAt = val;
  this.reservedUntil = val;
});
);

// Compound unique index per trip + seat
seatBookingSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });
seatBookingSchema.index({ tripId: 1, status: 1 });

const SeatBooking = mongoose.model("SeatBooking", seatBookingSchema);
export default SeatBooking;
