import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
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
    sender: {
      type: String, // Stored as String representing user/driver/agent/admin ID
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    messageType: {
      type: String,
      default: "text",
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    reactions: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep trip and tripId in sync before saving
chatMessageSchema.pre("save", function () {
  const targetTripId = this.tripId || this.trip;
  if (targetTripId) {
    this.tripId = targetTripId;
    this.trip = targetTripId;
  }
});

chatMessageSchema.index({ tripId: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
