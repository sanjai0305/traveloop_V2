import mongoose from "mongoose";

const tripActivitySchema = new mongoose.Schema(
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

const TripActivity = mongoose.model("TripActivity", tripActivitySchema);
export default TripActivity;
