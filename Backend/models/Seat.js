import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    seatNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Blocked"],
      default: "Reserved",
    },
  },
  { timestamps: true }
);

const Seat = mongoose.model("Seat", seatSchema);
export default Seat;
