import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
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
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    additionalInfo: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      default: "email",
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
    acceptedTerms: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    termsVersion: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    firebaseUid: {
      type: String,
      default: "",
    },
    pin: {
      type: String,
      default: "",
    },
    achievements: {
      type: [String],
      default: [],
    },
    lastActiveDate: {
      type: String,
      default: "",
    },
    upiId: {
      type: String,
      default: "",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups
userSchema.index({ firebaseUid: 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);
export default User;