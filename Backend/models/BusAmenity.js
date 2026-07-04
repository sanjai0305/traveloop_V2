import mongoose from "mongoose";

const busAmenitySchema = new mongoose.Schema(
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

const BusAmenity = mongoose.model("BusAmenity", busAmenitySchema);
export default BusAmenity;
