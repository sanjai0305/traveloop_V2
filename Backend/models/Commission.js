import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    defaultRate: {
      type: Number,
      default: 10,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Commission = mongoose.model("Commission", commissionSchema);
export default Commission;
