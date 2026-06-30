import Trip from "../models/Trip.js";
import Notification from "../models/Notification.js";
import { hasTripPermission } from "../utils/permissionHelper.js";

// Send chat notification with 60-second cooldown per recipient
export const sendChatNotification = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { senderName, message, messageType } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Check if the current user has access to this trip
    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to view this trip" });
    }

    const activeMembers = [];
    const ownerId = (trip.owner?._id || trip.owner || trip.user)?.toString();

    if (ownerId && ownerId !== req.user.id) {
      activeMembers.push(ownerId);
    }

    trip.collaborators?.forEach((c) => {
      const cId = (c.userId?._id || c.userId)?.toString();
      if (cId && cId !== req.user.id && c.acceptedAt !== null) {
        if (!activeMembers.includes(cId)) {
          activeMembers.push(cId);
        }
      }
    });

    const sanitizedMsg = message ? message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    const notificationText = `${senderName}: ${messageType === "image" ? "📷 Sent an image" : sanitizedMsg}`;

    const cooldownTime = new Date(Date.now() - 60000);

    for (const memberId of activeMembers) {
      // Check for unread chat notifications within the last 60 seconds
      const existingNotification = await Notification.findOne({
        user: memberId,
        trip: trip._id,
        type: "chat",
        read: false,
        createdAt: { $gte: cooldownTime }
      });

      if (!existingNotification) {
        await Notification.create({
          user: memberId,
          title: trip.title,
          message: notificationText,
          type: "chat",
          trip: trip._id,
          read: false
        });
      }
    }

    res.json({
      success: true,
      message: "Notifications processed"
    });
  } catch (error) {
    console.error("sendChatNotification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
