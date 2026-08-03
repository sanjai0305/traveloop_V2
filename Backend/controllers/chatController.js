import ChatMessage from "../models/ChatMessage.js";
import TripLocation from "../models/TripLocation.js";
import Trip from "../models/Trip.js";
import Notification from "../models/Notification.js";
import { triggerNotification } from "./notificationController.js";

/** Permission helper check */
const checkTripAccess = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return { allowed: false, status: 404, message: "Trip not found" };

  const authUserId = userId.toString();
  const ownerId = (trip.userId || trip.owner?._id || trip.owner || trip.user)?.toString();
  const isOwner = ownerId === authUserId;

  const isCollab = trip.collaborators?.some(
    (c) => c.userId && (c.userId._id || c.userId).toString() === authUserId && c.acceptedAt
  );

  if (!isOwner && !isCollab) {
    return { allowed: false, status: 403, message: "Forbidden: You are not a collaborator on this trip" };
  }

  const role = isOwner
    ? "owner"
    : trip.collaborators?.find((c) => (c.userId._id || c.userId).toString() === authUserId)?.role || "viewer";

  return { allowed: true, trip, isOwner, role };
};

// ── SEND MESSAGE ─────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      room = "general",
      message = "",
      messageType = "text",
      replyTo = null,
      replyToDetails = null,
      fileUrl = "",
      fileType = "",
      fileName = "",
      fileSize = 0,
      attachments = [],
      location = null,
      poll = null,
      expense = null,
      announcement = null,
      mentions = [],
    } = req.body;

    const access = await checkTripAccess(tripId, req.user._id || req.user.id);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // Only owner/admin can post announcements
    if (messageType === "announcement" || room === "announcements") {
      if (!access.isOwner && access.role !== "admin") {
        return res.status(403).json({ success: false, message: "Only the trip owner can post announcements." });
      }
    }

    const senderName = req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : (req.user.name || req.user.email);

    const newMsg = await ChatMessage.create({
      tripId,
      trip: tripId,
      room,
      sender: (req.user._id || req.user.id).toString(),
      senderName,
      senderAvatar: req.user.avatar || "",
      senderRole: access.role,
      message,
      messageType,
      replyTo,
      replyToDetails,
      reactions: {},
      fileUrl,
      fileType,
      fileName,
      fileSize,
      attachments,
      location: location || {},
      poll: poll || {},
      expense: expense || {},
      announcement: announcement || {},
      mentions,
      readBy: [{ userId: (req.user._id || req.user.id).toString(), readAt: new Date() }],
    });

    // Real-time socket broadcast
    try {
      if (req.io) {
        req.io.to(`trip_${tripId}`).emit("chat:message", newMsg);
        req.io.to(`trip:${tripId}`).emit("chat:message", newMsg);
      }
    } catch (_) {}

    // Send notifications to mentioned users or room members
    if (mentions && mentions.length > 0) {
      for (const m of mentions) {
        if (m.id && m.id !== (req.user._id || req.user.id).toString()) {
          try {
            await Notification.create({
              userId: m.id,
              user: m.id,
              title: `Mentioned in ${access.trip.title} 💬`,
              message: `${senderName}: ${message.slice(0, 80)}`,
              type: "chat_mention",
              tripId,
              trip: tripId,
            });
          } catch (_) {}
        }
      }
    }

    return res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    console.error("[sendMessage Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET MESSAGES ─────────────────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { room = "general", search = "", limit = 50, before = null } = req.query;

    const access = await checkTripAccess(tripId, req.user._id || req.user.id);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const query = { tripId, deletedAt: null };
    if (room && room !== "all") {
      query.room = room;
    }
    if (search && search.trim()) {
      query.$or = [
        { message: { $regex: search.trim(), $options: "i" } },
        { senderName: { $regex: search.trim(), $options: "i" } },
        { fileName: { $regex: search.trim(), $options: "i" } },
      ];
    }
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("[getMessages Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── EMOJI REACTIONS ──────────────────────────────────────────────────────────
export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    if (!emoji) {
      return res.status(400).json({ success: false, message: "Emoji is required" });
    }

    const msg = await ChatMessage.findById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const reactions = msg.reactions || {};
    const usersForEmoji = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

    const existingIdx = usersForEmoji.indexOf(userId);
    if (existingIdx > -1) {
      usersForEmoji.splice(existingIdx, 1); // Toggle off
    } else {
      usersForEmoji.push(userId); // Toggle on
    }

    if (usersForEmoji.length > 0) {
      reactions[emoji] = usersForEmoji;
    } else {
      delete reactions[emoji];
    }

    msg.reactions = reactions;
    msg.markModified("reactions");
    await msg.save();

    // Socket update
    try {
      if (req.io) {
        req.io.to(`trip_${msg.tripId}`).emit("chat:reaction", { messageId, reactions });
      }
    } catch (_) {}

    return res.status(200).json({ success: true, reactions });
  } catch (error) {
    console.error("[reactToMessage Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── EDIT MESSAGE ─────────────────────────────────────────────────────────────
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    const msg = await ChatMessage.findById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (msg.sender !== userId) {
      return res.status(403).json({ success: false, message: "Only message author can edit message" });
    }

    msg.message = message;
    msg.editedAt = new Date();
    await msg.save();

    try {
      if (req.io) {
        req.io.to(`trip_${msg.tripId}`).emit("chat:edit", { messageId, message, editedAt: msg.editedAt });
      }
    } catch (_) {}

    return res.status(200).json({ success: true, message: msg });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE MESSAGE ───────────────────────────────────────────────────────────
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    const msg = await ChatMessage.findById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const access = await checkTripAccess(msg.tripId, userId);
    if (msg.sender !== userId && !access.isOwner) {
      return res.status(403).json({ success: false, message: "Permission denied to delete message" });
    }

    msg.deletedAt = new Date();
    await msg.save();

    try {
      if (req.io) {
        req.io.to(`trip_${msg.tripId}`).emit("chat:delete", { messageId });
      }
    } catch (_) {}

    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── LIVE LOCATION SHARING ───────────────────────────────────────────────────
export const updateLiveLocation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { lat, lng, speed = 0, heading = 0, isLive = true, duration = "15m" } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    const access = await checkTripAccess(tripId, userId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    let minutes = 15;
    if (duration === "1h") minutes = 60;
    if (duration === "always") minutes = 1440; // 24h max

    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    const userName = req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : (req.user.name || req.user.email);

    if (!isLive) {
      await TripLocation.deleteOne({ tripId, userId });
      try {
        if (req.io) {
          req.io.to(`trip_${tripId}`).emit("chat:liveLocationStopped", { userId });
        }
      } catch (_) {}
      return res.status(200).json({ success: true, message: "Live location stopped" });
    }

    const loc = await TripLocation.findOneAndUpdate(
      { tripId, userId },
      {
        userName,
        userAvatar: req.user.avatar || "",
        lat,
        lng,
        speed,
        heading,
        isLive: true,
        duration,
        expiresAt,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    try {
      if (req.io) {
        req.io.to(`trip_${tripId}`).emit("chat:liveLocation", loc);
      }
    } catch (_) {}

    return res.status(200).json({ success: true, location: loc });
  } catch (error) {
    console.error("[updateLiveLocation Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveLocations = async (req, res) => {
  try {
    const { tripId } = req.params;
    const access = await checkTripAccess(tripId, req.user._id || req.user.id);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const locations = await TripLocation.find({
      tripId,
      expiresAt: { $gt: new Date() },
    });

    return res.status(200).json({ success: true, locations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POLL VOTING ──────────────────────────────────────────────────────────────
export const votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionId } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    const msg = await ChatMessage.findById(messageId);
    if (!msg || !msg.poll) {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }

    if (msg.poll.isClosed) {
      return res.status(400).json({ success: false, message: "Poll is closed" });
    }

    // Toggle vote on optionId
    msg.poll.options.forEach((opt) => {
      const idx = opt.votes.indexOf(userId);
      if (opt.id === optionId) {
        if (idx === -1) opt.votes.push(userId);
        else opt.votes.splice(idx, 1);
      } else {
        // Single choice: remove from other options
        if (idx > -1) opt.votes.splice(idx, 1);
      }
    });

    msg.markModified("poll");
    await msg.save();

    try {
      if (req.io) {
        req.io.to(`trip_${msg.tripId}`).emit("chat:poll", { messageId, poll: msg.poll });
      }
    } catch (_) {}

    return res.status(200).json({ success: true, poll: msg.poll });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── EXPENSE REQUEST PAYMENT ──────────────────────────────────────────────────
export const markExpensePaid = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    const msg = await ChatMessage.findById(messageId);
    if (!msg || !msg.expense) {
      return res.status(404).json({ success: false, message: "Expense request not found" });
    }

    msg.expense.status = "paid";
    msg.expense.paidBy = userId;
    msg.markModified("expense");
    await msg.save();

    try {
      if (req.io) {
        req.io.to(`trip_${msg.tripId}`).emit("chat:expensePaid", { messageId, expense: msg.expense });
      }
    } catch (_) {}

    return res.status(200).json({ success: true, expense: msg.expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── AI ASSISTANT CHATBOT ─────────────────────────────────────────────────────
export const askAiAssistant = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { question } = req.body;

    const access = await checkTripAccess(tripId, req.user._id || req.user.id);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const tripTitle = access.trip.title || "Paris Trip";
    const dest = access.trip.destination || "destination";

    let aiAnswer = `Here is helpful information for ${dest}:\n`;
    const qLower = question.toLowerCase();

    if (qLower.includes("weather")) {
      aiAnswer += `☀️ Expected Weather: Sunny with comfortable daytime temperatures around 22°C (72°F). Light evening breeze expected!`;
    } else if (qLower.includes("budget") || qLower.includes("cost") || qLower.includes("expense")) {
      aiAnswer += `💰 Budget Tip: Average daily expenses per traveler in ${dest} range between $45 to $85 for food, transport, and entry tickets.`;
    } else if (qLower.includes("food") || qLower.includes("restaurant") || qLower.includes("eat")) {
      aiAnswer += `🍽️ Top Recommended Dining Places:\n1. Le Petit Bistro — Authentic local cuisine\n2. Café de Paris — Great coffee & pastries\n3. Gourmet Central — Popular family restaurant`;
    } else if (qLower.includes("pack") || qLower.includes("clothes")) {
      aiAnswer += `🧳 Packing Advice:\n- Comfortable walking shoes\n- Light jacket for evenings\n- Universal power adapter\n- Travel documents & passport copy`;
    } else {
      aiAnswer += `💡 Traveloop AI Assistant: For your trip to ${tripTitle}, make sure all flight passes, hotel check-ins, and daily itinerary activities are saved in your shared trip workspace!`;
    }

    const aiMsg = await ChatMessage.create({
      tripId,
      trip: tripId,
      room: "general",
      sender: "ai-assistant",
      senderName: "Traveloop AI Bot 🤖",
      senderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop",
      senderRole: "admin",
      message: aiAnswer,
      messageType: "ai",
      readBy: [{ userId: (req.user._id || req.user.id).toString(), readAt: new Date() }],
    });

    try {
      if (req.io) {
        req.io.to(`trip_${tripId}`).emit("chat:message", aiMsg);
      }
    } catch (_) {}

    return res.status(200).json({ success: true, aiMessage: aiMsg });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SHARED MEDIA ─────────────────────────────────────────────────────────
export const getSharedMedia = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { category = "all" } = req.query;

    const access = await checkTripAccess(tripId, req.user._id || req.user.id);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const query = { tripId, deletedAt: null };

    if (category === "photos") {
      query.messageType = "image";
    } else if (category === "videos") {
      query.messageType = "video";
    } else if (category === "documents") {
      query.messageType = "document";
    } else if (category === "audio") {
      query.messageType = "audio";
    } else if (category === "locations") {
      query.messageType = { $in: ["location", "live_location"] };
    } else {
      query.messageType = { $in: ["image", "video", "document", "audio", "location", "live_location"] };
    }

    const items = await ChatMessage.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy stubs
export const sendChatNotification = (req, res) => res.json({ success: true });
export const markSeen = (req, res) => res.json({ success: true });
