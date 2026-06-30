// models/Budget.js
import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    budgetName: {
      type: String,
      required: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      default: 0,
    },
    plannedExpense: {
      type: Number,
      default: 0,
    },
    actualExpense: {
      type: Number,
      default: 0,
    },
    remainingBudget: {
      type: Number,
      default: 0,
    },
    utilizationPercentage: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    category: {
      type: String,
      default: "", // Solo Trip, Family Trip, Friends Trip, Business Trip
    },
    categories: {
      accommodation: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      food: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      transport: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      activities: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      shopping: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      others: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      }
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
