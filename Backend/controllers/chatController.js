import Trip from "../models/Trip.js";
import Notification from "../models/Notification.js";
import ChatMessage from "../models/ChatMessage.js";
import ChatReadStatus from "../models/ChatReadStatus.js";
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

// Send a new chat message
export const sendMessage = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { message, messageType, fileUrl, fileType, fileName, replyTo } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to access this trip" });
    }

    const senderName = req.user.firstName || req.user.email;
    const senderAvatar = req.user.avatarUrl || "";

    const savedMessage = await ChatMessage.create({
      tripId,
      sender: req.user.id,
      senderName,
      senderAvatar,
      message,
      messageType,
      fileUrl,
      fileType,
      fileName,
      replyTo,
    });

    // Update sender's read status
    await ChatReadStatus.findOneAndUpdate(
      { tripId, userId: req.user.id },
      { lastSeenAt: new Date() },
      { upsert: true, returnDocument: "after" }
    );

    // Socket.io Broadcast
    const io = req.app.get("io");
    if (io) {
      io.to(tripId).emit("new_chat_message", savedMessage);
    }

    res.status(201).json({
      success: true,
      message: savedMessage
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Retrieve chat messages for a trip
export const getMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to access this trip" });
    }

    const messages = await ChatMessage.find({ tripId });
    const activeMessages = messages.filter(m => !m.deletedAt);

    res.json({
      success: true,
      messages: activeMessages
    });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a trip's chat as read/seen
export const markSeen = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to access this trip" });
    }

    await ChatReadStatus.findOneAndUpdate(
      { tripId, userId: req.user.id },
      { lastSeenAt: new Date() },
      { upsert: true, returnDocument: "after" }
    );

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("markSeen error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add or toggle emoji reaction to message
export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    let reactions = message.reactions || [];
    const existingIndex = reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
    if (existingIndex > -1) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ userId, emoji });
    }

    message.reactions = reactions;
    await message.save();

    res.json({
      success: true,
      reactions: message.reactions,
      message
    });
  } catch (error) {
    console.error("reactToMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit a chat message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newText } = req.body;

    const chatMsg = await ChatMessage.findById(messageId);
    if (!chatMsg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (chatMsg.sender !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: You cannot edit someone else's message" });
    }

    chatMsg.message = newText;
    chatMsg.editedAt = new Date();
    await chatMsg.save();

    res.json({
      success: true,
      message: chatMsg
    });
  } catch (error) {
    console.error("editMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete a chat message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const chatMsg = await ChatMessage.findById(messageId);
    if (!chatMsg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (chatMsg.sender !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: You cannot delete someone else's message" });
    }

    chatMsg.deletedAt = new Date();
    await chatMsg.save();

    res.json({
      success: true,
      message: "Message deleted"
    });
  } catch (error) {
    console.error("deleteMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
