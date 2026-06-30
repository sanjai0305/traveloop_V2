import mongoose from "mongoose";

const tripSchema =
  new mongoose.Schema(
    {
      user: {
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
      },

      endDate: {
        type: String,
      },

      budget: {
        type: Number,
      },

      expenses: {
        transport: { type: Number, default: 0 },
        accommodation: { type: Number, default: 0 },
        food: { type: Number, default: 0 },
        activities: { type: Number, default: 0 },
        shopping: { type: Number, default: 0 },
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
        enum: ["planning", "upcoming", "ongoing", "completed"],
        default: "planning",
      },

      destinationName: {
        type: String,
      },

      placeId: {
        type: String,
      },

      formattedAddress: {
        type: String,
      },

      country: {
        type: String,
      },

      state: {
        type: String,
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },

      travelers: {
        type: Number,
      },

      description: {
        type: String,
      },

      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      collaborators: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          role: {
            type: String,
            enum: ["editor", "viewer"],
            default: "viewer",
          },
          invitedAt: {
            type: Date,
            default: Date.now,
          },
          acceptedAt: {
            type: Date,
            default: null,
          },
        },
      ],
      visibility: { type: String, enum: ["private", "collaborators", "public"], default: "private" },
      expenseItems: [
        {
          description: { type: String, required: true },
          amount: { type: Number, required: true },
          currency: { type: String, default: "INR" },
          convertedAmount: { type: Number, required: true }, // in base currency
          baseCurrency: { type: String, default: "INR" },
          exchangeRate: { type: Number, default: 1 },
          exchangeRateDate: { type: Date, default: Date.now },
          category: { type: String, default: "shopping" },
          paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          paidByName: { type: String, required: true },
          participants: [
            {
              userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
              name: { type: String, required: true },
              amountOwed: { type: Number, required: true }
            }
          ],
          date: { type: Date, default: Date.now },
          settled: { type: Boolean, default: false }
        }
      ],
      settlements: [
        {
          from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          fromName: { type: String, required: true },
          to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          toName: { type: String, required: true },
          amount: { type: Number, required: true },
          currency: { type: String, default: "INR" },
          date: { type: Date, default: Date.now }
        }
      ],
      shareAnalytics: {
        views: { type: Number, default: 0 },
        visitors: { type: Number, default: 0 },
        visitorCountries: [
          {
            country: { type: String },
            count: { type: Number, default: 1 }
          }
        ],
        lastViewed: { type: Date, default: null }
      },
      tripType: {
        type: String,
        enum: ["manual", "booked"],
        default: "manual"
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        default: null
      },
      createdFromBooking: {
        type: Boolean,
        default: false
      },
      agentTrip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AgentTrip",
        default: null
      },
    },

    {
      timestamps: true,
    }
  );

tripSchema.pre("save", function (next) {
  if (!this.owner) {
    this.owner = this.user;
  }
  if (typeof next === "function") {
    next();
  }
});

const Trip =
  mongoose.model(
    "Trip",
    tripSchema
  );

export default Trip;