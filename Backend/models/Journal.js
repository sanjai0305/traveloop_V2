import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    day: {
      type: Number,
      required: true,
      min: 1,
    },

    date: {
      type: String, // ISO date string
    },

    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      default: "",
    },

    photos: [
      {
        url: { type: String },
        caption: { type: String, default: "" },
      },
    ],

    mood: {
      type: String,
      enum: ["amazing", "great", "okay", "tired", "rough"],
      default: "great",
    },

    highlights: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Journal = mongoose.model("Journal", journalSchema);

export default Journal;
