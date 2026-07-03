import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      default: null,
    },
    endDate: {
      type: String,
      default: null,
    },
    budget: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "planning",
    },
    collaborators: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, default: "viewer" }, // e.g. editor, viewer
        acceptedAt: { type: Date, default: null },
      },
    ],
    shareAnalytics: {
      views: { type: Number, default: 0 },
      visitors: { type: Number, default: 0 },
      visitorCountries: { type: [String], default: [] },
      lastViewed: { type: Date, default: null },
    },
    expenseItems: [
      {
        id: { type: String },
        description: { type: String },
        amount: { type: Number, default: 0 },
        currency: { type: String, default: "INR" },
        category: { type: String, default: "misc" },
        convertedAmount: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
        paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    expenses: {
      transport: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      shopping: { type: Number, default: 0 },
      misc: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tripSchema.index({ userId: 1 });
tripSchema.index({ shareToken: 1 }, { sparse: true });

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;