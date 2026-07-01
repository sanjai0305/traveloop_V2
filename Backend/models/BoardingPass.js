import mongoose from "../config/mongooseMock.js";

const boardingPassSchema = new mongoose.Schema(
  {
    // Booking reference
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    bookingId: { type: String, required: true },   // human-readable e.g. TLP-12345

    // Trip reference
    agentTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
    },

    // Traveler reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Driver who scanned
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },

    // Seat assigned by driver
    seatNumber: { type: String, default: "" },

    // Boarding status
    status: {
      type: String,
      enum: ["not_boarded", "boarded", "no_show"],
      default: "not_boarded",
    },

    boardedAt: { type: Date, default: null },

    // sha256 hash of the QR JWT to prevent reuse
    qrTokenHash: { type: String, default: null },

    // QR generated timestamp (to enforce 24h window)
    qrGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for fast lookup by booking + trip
boardingPassSchema.index({ booking: 1, agentTrip: 1 });
boardingPassSchema.index({ qrTokenHash: 1 }, { unique: true, sparse: true });

const BoardingPass = mongoose.model("BoardingPass", boardingPassSchema);
export default BoardingPass;
