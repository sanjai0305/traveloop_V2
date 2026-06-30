import mongoose from "mongoose";

const chatReadStatusSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  }
);

chatReadStatusSchema.index({ tripId: 1, userId: 1 }, { unique: true });

const ChatReadStatus = mongoose.model("ChatReadStatus", chatReadStatusSchema);
export default ChatReadStatus;
