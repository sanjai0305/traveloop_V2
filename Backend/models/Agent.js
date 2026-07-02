import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      default: "",
    },
    displayName: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      required: true,
      default: "Pending Verification",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    gstNumber: {
      type: String,
      default: "",
    },
    businessCategory: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    instagram: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "active",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
