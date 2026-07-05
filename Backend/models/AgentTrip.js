import mongoose from "mongoose";

const agentTripSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    tagline: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    tripType: {
      type: String,
      default: "",
    },
    destinations: {
      type: [String],
      default: [],
    },
    destination: {
      type: String,
      default: "",
    },
    originCity: {
      type: String,
      default: "",
    },
    pickupLocation: {
      type: String,
      default: "",
    },
    pickupPoint: {
      type: String,
      default: "",
    },
    meetingPoint: {
      type: String,
      default: "",
    },
    dropPoint: {
      type: String,
      default: "",
    },
    intermediateStops: {
      type: [String],
      default: [],
    },
    googleMapsUrl: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    departureTime: {
      type: String,
      default: "",
    },
    arrivalTime: {
      type: String,
      default: "",
    },
    reportingTime: {
      type: String,
      default: "",
    },
    bookingDeadline: {
      type: String,
      default: "",
    },
    cancellationDeadline: {
      type: String,
      default: "",
    },
    cancellationUntilDate: {
      type: String,
      default: "",
    },
    cancellationUntilTime: {
      type: String,
      default: "",
    },
    busType: {
      type: String,
      default: "",
    },
    busNumber: {
      type: String,
      default: "",
    },
    totalSeats: {
      type: Number,
      default: 40,
    },
    availableSeats: {
      type: Number,
      default: 40,
    },
    bookedSeats: {
      type: Number,
      default: 0,
    },
    driverName: {
      type: String,
      default: "",
    },
    driverPhone: {
      type: String,
      default: "",
    },
    driverGmail: {
      type: String,
      default: "",
    },
    driverPhoto: {
      type: String,
      default: "",
    },
    driverLicenseNumber: {
      type: String,
      default: "",
    },
    emergencyContact: {
      type: String,
      default: "",
    },
    pricePerPerson: {
      type: Number,
      default: 0,
    },
    originalPrice: {
      type: Number,
      default: 0.00,
    },
    offerPrice: {
      type: Number,
      default: 0.00,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    gstPercentage: {
      type: Number,
      default: 5,
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    mealsIncluded: {
      type: [String],
      default: [],
    },
    includedServices: {
      type: [String],
      default: [],
    },
    hotelName: {
      type: String,
      default: "",
    },
    hotelRating: {
      type: Number,
      default: 0,
    },
    roomType: {
      type: String,
      default: "",
    },
    hotels: [
      {
        name: { type: String, default: "" },
        category: { type: String, default: "3 Star" },
        address: { type: String, default: "" },
        mapsLink: { type: String, default: "" },
        photos: { type: [String], default: [] },
        roomType: { type: String, default: "Double" },
        occupancy: { type: Number, default: 2 },
        nightStayCount: { type: Number, default: 1 },
        notes: { type: String, default: "" }
      }
    ],
    foodIncluded: {
      type: Boolean,
      default: false,
    },
    deadlineEnabled: {
      type: Boolean,
      default: false,
    },
    deadlineDate: {
      type: String,
      default: "",
    },
    deadlineTime: {
      type: String,
      default: "",
    },
    pickupMapsLink: {
      type: String,
      default: "",
    },
    dropMapsLink: {
      type: String,
      default: "",
    },
    packingChecklist: {
      type: [String],
      default: [],
    },
    activities: {
      type: [String],
      default: [],
    },
    itinerary: [
      {
        day: { type: Number },
        title: { type: String },
        description: { type: String },
        hotel: { type: String, default: "" },
        images: { type: [String], default: [] },
        activity: { type: String, default: "" },
        time: { type: String, default: "" },
        duration: { type: String, default: "" },
        destination: { type: String, default: "" },
        placesCovered: { type: String, default: "" },
        lunch: { type: String, default: "" },
        stay: { type: String, default: "" },
        nightStay: { type: String, default: "" }
      }
    ],
    allowCancellation: {
      type: Boolean,
      default: true,
    },
    refundPolicy: {
      type: String,
      default: "",
    },
    cancellationPolicy: {
      type: String,
      default: "",
    },
    termsConditions: {
      type: String,
      default: "",
    },
    exclusions: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "draft",
    },
    publishStatus: {
      type: String,
      default: "draft",
    },
    published: {
      type: Boolean,
      default: false,
    },
    visible: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    activeStep: {
      type: Number,
      default: 1,
    },
    progressPercentage: {
      type: Number,
      default: 10,
    },
    customActivities: {
      type: [String],
      default: [],
    },
    customHotelAmenities: {
      type: [String],
      default: [],
    },
    customBusAmenities: {
      type: [String],
      default: [],
    },
    cancellationConfirmations: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        confirmedAt: { type: Date, default: Date.now }
      }
    ],
    boardingStatus: {
      type: String,
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
    boardingClosesAt: {
      type: Date,
      default: null,
    },
    approvalStatus: {
      type: String,
      default: "approved",
    },
    maleCount: {
      type: Number,
      default: 0,
    },
    femaleCount: {
      type: Number,
      default: 0,
    },
    childrenCount: {
      type: Number,
      default: 0,
    },
    boardedCount: {
      type: Number,
      default: 0,
    },
    noShowCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
      default: "",
    },
    busImages: {
      type: [String],
      default: [],
    },
    gallery: {
      type: [String],
      default: [],
    },
    occupancy: {
      type: Number,
      default: 0,
    },
    transportImages: {
      frontImage: { type: String, default: "" },
      backImage: { type: String, default: "" },
      interiorImages: { type: [String], default: [] },
      seatImages: { type: [String], default: [] },
    },
    commissionPercentage: {
      type: Number,
      default: 10,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    occupancyRate: {
      type: Number,
      default: 0,
    },
    walletAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep driver/driverId and destination synced; recalculate occupancy
agentTripSchema.pre("save", function () {
  if (this.driver && !this.driverId) {
    this.driverId = this.driver;
  }
  if (this.driverId && !this.driver) {
    this.driver = this.driverId;
  }
  if (Array.isArray(this.destinations) && this.destinations.length > 0 && !this.destination) {
    this.destination = this.destinations[0];
  }
  
  // occupancy rate calculation
  const total = this.totalSeats || 0;
  const booked = this.bookedSeats || 0;
  this.occupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
});

agentTripSchema.index({ agentId: 1 });
agentTripSchema.index({ driverId: 1 });

const AgentTrip = mongoose.model("AgentTrip", agentTripSchema);
export default AgentTrip;

