import mongoose from "mongoose";

const noteSchema =
  new mongoose.Schema(
    {
      trip: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      content: {
        type: String,
        required: true,
      },

      day: {
        type: Number,
        default: null,
      },

      pinned: {
        type: Boolean,
        default: false,
      },

      tags: [
        {
          type: String,
        }
      ],

      type: {
        type: String,
        enum: ["trip", "day"],
        default: "trip",
      },
    },
    {
      timestamps: true,
    }
  );

const Note = mongoose.model(
  "Note",
  noteSchema
);

export default Note;