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
      default: "approved",
    },
    role: {
      type: String,
      default: "agent",
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    dob: {
      type: String,
      default: "",
    },
    mobile: {
      type: String,
      default: "",
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    gstNo: {
      type: String,
      default: "",
    },
    companyLogo: {
      type: String,
      default: "",
    },
    agentPhoto: {
      type: String,
      default: "",
    },
    kycStatus: {
      type: String,
      enum: ["PENDING", "EMAIL_VERIFIED", "MOBILE_VERIFIED", "KYC_COMPLETED", "APPROVED"],
      default: "PENDING",
    },
    emailOtp: {
      type: String,
      default: "",
    },
    emailOtpExpiry: {
      type: Date,
      default: null,
    },
    mobileOtp: {
      type: String,
      default: "",
    },
    mobileOtpExpiry: {
      type: Date,
      default: null,
    },

    // ── Trip Slot System ─────────────────────────────────────────────────────
    tripSlots: {
      type: Number,
      default: 2,
    },
    usedSlots: {
      type: Number,
      default: 0,
    },
    bonusSlots: {
      type: Number,
      default: 0,
    },
    purchasedSlots: {
      type: Number,
      default: 0,
    },

    // ── Agent Referral System ────────────────────────────────────────────────
    referralCode: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
