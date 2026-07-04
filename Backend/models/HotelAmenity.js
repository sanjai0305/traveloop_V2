import mongoose from "mongoose";

const hotelAmenitySchema = new mongoose.Schema(
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

const HotelAmenity = mongoose.model("HotelAmenity", hotelAmenitySchema);
export default HotelAmenity;
