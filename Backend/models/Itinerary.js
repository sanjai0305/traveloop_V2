import mongoose from "mongoose";

const itinerarySchema =
  new mongoose.Schema(
    {
      trip: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true,
      },

      day: {
        type: Number,
        required: true,
      },

      time: {
        type: String,
        default: "09:00",
      },

      title: {
        type: String,
        required: true,
      },

      place: {
        type: String,
        default: "",
      },

      category: {
        type: String,
        default: "Activity",
      },

      budget: {
        type: Number,
        default: 0,
      },

      note: {
        type: String,
        default: "",
      },

      // AI-generated activity flag
      isAiSuggestion: {
        type: Boolean,
        default: false,
      },

      aiSource: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

const Itinerary =
  mongoose.model(
    "Itinerary",
    itinerarySchema
  );

export default Itinerary;