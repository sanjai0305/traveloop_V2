import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    budgetName: {
      type: String,
      default: "",
    },
    totalBudget: {
      type: Number,
      default: 0.00,
    },
    currency: {
      type: String,
      default: "INR",
    },
    category: {
      type: String,
      default: "",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    plannedExpense: {
      type: Number,
      default: 0.00,
    },
    actualExpense: {
      type: Number,
      default: 0.00,
    },
    remainingBudget: {
      type: Number,
      default: 0.00,
    },
    categories: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip/tripId and user/userId in sync before saving
budgetSchema.pre("save", function (next) {
  const targetTripId = this.tripId || this.trip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.trip = targetTripId;
  }
  const targetUserId = this.userId || this.user;
  if (targetUserId) {
    this.userId = targetUserId;
    this.user = targetUserId;
  }
  next();
});

budgetSchema.index({ tripId: 1 });

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
