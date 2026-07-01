import mongoose from "../config/mongooseMock.js";

const commissionSchema = new mongoose.Schema(
  {
    defaultRate: {
      type: Number,
      required: true,
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
