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
    },

    phone: {
      type: String,
    },

    city: {
      type: String,
    },

    country: {
      type: String,
    },

    additionalInfo: {
      type: String,
      default: "",
    },

    password: {
      type: String,
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
      enum: ["email", "google"],
      default: "email",
    },

    savedDestinations: [
      {
        type: String,
      }
    ],

    language: {
      type: String,
      default: "en",
    },

    privacyVisibility: {
      type: String,
      default: "private",
    },

    notificationPreferences: {
      reminders: { type: Boolean, default: true },
      budget: { type: Boolean, default: true },
      weather: { type: Boolean, default: true },
      statusUpdates: { type: Boolean, default: true },
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
    upiId: { type: String, default: "" },
    achievements: { type: [String], default: [] },
    acceptedTerms: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date, default: null },
    termsVersion: { type: String, default: "" },
    lastLogin: { type: Date, default: null },
    firebaseUid: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model(
  "User",
  userSchema
);

export default User;