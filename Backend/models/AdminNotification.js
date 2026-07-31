import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
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
    read: {
      type: Boolean,
      default: false,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      default: null,
    },
    resourceId: {
      type: String,
      default: "",
    },
    resourceType: {
      type: String,
      default: "trip",
    },
  },
  {
    timestamps: true,
  }
);

adminNotificationSchema.index({ read: 1 });

adminNotificationSchema.post("save", async function (doc) {
  try {
    const { _io } = await import("../controllers/notificationController.js");
    if (_io) {
      _io.emit("adminNotification", doc);
      console.log("[Socket.io] Broadcasted adminNotification:", doc.title);
    }
  } catch (err) {
    console.error("Failed to broadcast admin notification via socket:", err);
  }
});

const AdminNotification = mongoose.model("AdminNotification", adminNotificationSchema);
export default AdminNotification;
