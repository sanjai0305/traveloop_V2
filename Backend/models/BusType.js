import mongoose from "mongoose";

const busTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const BusType = mongoose.model("BusType", busTypeSchema);
export default BusType;
