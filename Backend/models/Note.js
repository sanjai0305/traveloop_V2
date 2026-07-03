import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip/tripId and user/userId in sync
noteSchema.pre("save", function () {
  const targetTripId = this.tripId || this.trip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.trip = targetTripId;
  }
  const targetUserId = this.userId || this.user;
  if (targetUserId) {
    this.userId = targetUserId;
    this.user = targetUserId;
  }
});

noteSchema.index({ tripId: 1 });

const Note = mongoose.model("Note", noteSchema);
export default Note;