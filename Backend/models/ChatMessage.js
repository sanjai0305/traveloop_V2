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
    room: {
      type: String,
      default: "general", // "general", "announcements", "budget", "flights"
    },
    sender: {
      type: String, // User ID string
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
    senderRole: {
      type: String,
      default: "viewer", // "owner", "editor", "viewer", "admin"
    },
    message: {
      type: String,
      default: "",
    },
    messageType: {
      type: String,
      default: "text", // "text", "image", "video", "document", "audio", "location", "live_location", "poll", "expense", "announcement", "ai"
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    replyToDetails: {
      messageId: String,
      senderName: String,
      messageText: String,
    },
    reactions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // e.g. { "👍": ["userId1", "userId2"], "❤️": ["userId3"] }
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
    fileSize: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        url: String,
        name: String,
        size: Number,
        type: String,
      },
    ],
    // Static & Live Location payload
    location: {
      name: { type: String, default: "" },
      address: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      isLive: { type: Boolean, default: false },
      duration: { type: String, default: "15m" }, // "15m", "1h", "always"
      expiresAt: { type: Date, default: null },
      speed: { type: Number, default: 0 },
      distance: { type: String, default: "" },
    },
    // Poll payload
    poll: {
      question: { type: String, default: "" },
      options: [
        {
          id: String,
          text: String,
          votes: [{ type: String }], // userIds who voted for this option
        },
      ],
      isClosed: { type: Boolean, default: false },
    },
    // Expense request payload
    expense: {
      title: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      status: { type: String, default: "pending" }, // "pending", "paid"
      paidBy: { type: String, default: "" },
      splitWith: [{ type: String }],
      upiQr: { type: String, default: "" },
    },
    // Announcement payload
    announcement: {
      title: { type: String, default: "" },
      content: { type: String, default: "" },
      isPinned: { type: Boolean, default: true },
      priority: { type: String, default: "normal" }, // "normal", "high", "urgent"
    },
    mentions: [
      {
        id: String, // userId or role ("@everyone", "@Owner", "@Editors")
        name: String,
      },
    ],
    readBy: [
      {
        userId: { type: String },
        readAt: { type: Date, default: Date.now },
      },
    ],
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
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

chatMessageSchema.index({ tripId: 1, room: 1, createdAt: -1 });
chatMessageSchema.index({ tripId: 1, "announcement.isPinned": 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
