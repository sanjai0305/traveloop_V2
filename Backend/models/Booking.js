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
    agentTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
    },
    seats: {
      type: Number,
      default: 1,
    },
    pricePaid: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: "Paid",
    },
    boardingStatus: {
      type: String,
      default: "Pending",
    },
    assignedSeat: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep tripId and agentTrip in sync before saving
bookingSchema.pre("save", function (next) {
  const targetTripId = this.tripId || this.agentTrip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.agentTrip = targetTripId;
  }
  next();
});

bookingSchema.index({ userId: 1 });
bookingSchema.index({ tripId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
