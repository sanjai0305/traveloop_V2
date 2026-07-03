import mongoose from "mongoose";

const checklistSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    item: {
      type: String,
    },
    category: {
      type: String,
      default: "General",
    },
    packed: {
      type: Boolean,
      default: false,
    },
    checked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip/tripId, item/itemName, and checked/packed in sync
checklistSchema.pre("save", function () {
  const targetTripId = this.tripId || this.trip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.trip = targetTripId;
  }
  const name = this.itemName || this.item;
  if (name) {
    this.itemName = name;
    this.item = name;
  }
  const status = this.packed !== undefined ? this.packed : this.checked;
  if (status !== undefined) {
    this.packed = status;
    this.checked = status;
  }
});

checklistSchema.index({ tripId: 1 });
checklistSchema.index({ userId: 1 });

const Checklist = mongoose.model("Checklist", checklistSchema);
export default Checklist;