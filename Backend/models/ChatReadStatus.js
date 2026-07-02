import mongoose from "mongoose";

const chatReadStatusSchema = new mongoose.Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip/tripId and user/userId in sync
chatReadStatusSchema.pre("save", function (next) {
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
  next();
});

chatReadStatusSchema.index({ tripId: 1, userId: 1 }, { unique: true });

const ChatReadStatus = mongoose.model("ChatReadStatus", chatReadStatusSchema);
export default ChatReadStatus;
