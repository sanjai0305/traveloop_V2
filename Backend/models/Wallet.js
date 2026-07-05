import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    withdrawableBalance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        date: { type: Date, default: Date.now },
        bookingId: { type: String, default: "" },
        customerName: { type: String, default: "" },
        amount: { type: Number, default: 0 },
        commission: { type: Number, default: 0 },
        netEarnings: { type: Number, default: 0 },
        status: { type: String, enum: ["Completed", "Pending", "Refunded"], default: "Pending" },
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
