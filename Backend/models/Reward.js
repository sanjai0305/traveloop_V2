import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    points: {
      type: Number,
      default: 100,
    },
    rewardType: {
      type: String,
      enum: ["FLAT_DISCOUNT", "PERCENTAGE_DISCOUNT", "CASHBACK", "COINS", "REFERRAL_BONUS", "FESTIVAL_REWARD", "MILESTONE_REWARD"],
      default: "FLAT_DISCOUNT",
    },
    discountValue: {
      type: Number,
      default: 200,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      default: "FLAT",
    },
    minimumBookingAmount: {
      type: Number,
      default: 1000,
    },
    status: {
      type: String,
      enum: ["available", "claimed"],
      default: "available",
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    couponCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Reward = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);
export default Reward;
