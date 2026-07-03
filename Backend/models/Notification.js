import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "info",
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    isInvite: {
      type: Boolean,
      default: false,
    },
    inviteStatus: {
      type: String,
      default: null,
    },
    read: {
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

// Keep user/userId and trip/tripId in sync before saving
notificationSchema.pre("save", function (next) {
  if (this.userId) {
    this.user = this.userId;
  }
  if (this.tripId) {
    this.trip = this.tripId;
  }
  next();
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ tripId: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
