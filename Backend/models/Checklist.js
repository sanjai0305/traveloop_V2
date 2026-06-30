import mongoose from "mongoose";

const checklistSchema =
  new mongoose.Schema(
    {
      trip: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true,
      },

      item: {
        type: String,
        required: true,
      },

      category: {
        type: String,
        default: "General",
      },

      checked: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

const Checklist =
  mongoose.model(
    "Checklist",
    checklistSchema
  );

export default Checklist;