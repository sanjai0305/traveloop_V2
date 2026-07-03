import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
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
    action: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip/tripId and user/userId in sync
activityLogSchema.pre("save", function () {
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

activityLogSchema.index({ tripId: 1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
