import mongoose from "mongoose";

const itineraryDaySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  hotel: {
    type: String,
    default: "",
  },
  images: [
    {
      type: String,
    }
  ],
});

const agentTripSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    destinations: [
      {
        type: String,
        required: true,
      }
    ],
    duration: {
      type: String, // E.g., "3 Days / 2 Nights"
      required: true,
    },
    startDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    endDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    departureTime: {
      type: String,
    },
    arrivalTime: {
      type: String,
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    busType: {
      type: String, // E.g., AC Sleeper
      required: true,
    },
    busNumber: {
      type: String,
      required: true,
    },
    busImages: [
      {
        type: String,
      }
    ],
    gallery: [
      {
        type: String,
      }
    ],
    coverImage: {
      type: String,
      default: "",
    },
    driverName: {
      type: String,
    },
    driverPhone: {
      type: String,
    },
    driverLicenseNumber: {
      type: String,
    },
    driverGmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    emergencyContact: {
      type: String,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
    },
    availableSeats: {
      type: Number,
      required: true,
    },
    pricePerPerson: {
      type: Number,
      required: true,
    },
    includedServices: [
      {
        type: String, // Food, Accommodation, Transport, Guide, Insurance, etc.
      }
    ],
    exclusions: {
      type: String,
      default: "",
    },
    termsConditions: {
      type: String,
      default: "",
    },
    cancellationPolicy: {
      type: String,
      default: "",
    },
    itinerary: [itineraryDaySchema],

    // ── Publishing & extended fields ──────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "published", "closed", "completed", "cancelled"],
      default: "draft",
    },
    boardingStatus: {
      type: String,
      enum: ["CLOSED", "OPEN", "COMPLETED"],
      default: "CLOSED",
    },
    boardingOpenedAt: {
      type: Date,
      default: null,
    },
    boardingClosedAt: {
      type: Date,
      default: null,
    },
    publishStatus: {
      type: String,
      enum: ["draft", "pending", "published", "closed", "completed"],
      default: "draft",
    },
    subtitle: { type: String, default: "" },
    originCity: { type: String, default: "" },
    category: { type: String, default: "" },
    originalPrice: { type: Number, default: 0 },
    offerPrice: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    driverAlternateMobile: { type: String, default: "" },
    driverExperience: { type: Number, default: 0 },
    driverPhoto: { type: String, default: "" },
    seatLayoutImage: { type: String, default: "" },
    hotelName: { type: String, default: "" },
    hotelRating: { type: Number, default: 0 },
    roomType: { type: String, default: "" },
    mealsIncluded: [{ type: String }],
    excludedServices: [{ type: String }],
    bookedSeats: { type: Number, default: 0 },
    maleCount: { type: Number, default: 0 },
    femaleCount: { type: Number, default: 0 },
    childrenCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
    dropPoint: { type: String, default: "" },
    allowCancellation: { type: Boolean, default: true },
    cancellationUntilDate: { type: String, default: "" },
    cancellationUntilTime: { type: String, default: "18:00" },
    refundPolicy: { type: String, default: "Fully Refundable" },
    // ── Driver Portal assignment ──────────────────────────────────
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    // Boarding live stats (updated on each scan)
    boardedCount:   { type: Number, default: 0 },
    noShowCount:    { type: Number, default: 0 },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "published", "deleted"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const AgentTrip = mongoose.model("AgentTrip", agentTripSchema);
export default AgentTrip;

