import Notification from "../models/Notification.js";

// Socket.IO instance injected at server startup via setIo()
let _io = null;
export const setIo = (io) => { _io = io; };

/** Emit a notification to the user's personal socket room */
const pushToSocket = (userId, notification) => {
  if (_io && userId) {
    _io.to(`user_${userId.toString()}`).emit("notification", notification);
  }
};

// GET ALL NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    const data = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });

    const notifications = (data || []).map(r => {
      const obj = r.toObject ? r.toObject() : r;
      return {
        ...obj,
        _id: r._id,
        user: r.userId,
        trip: r.tripId
      };
    });

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MARK NOTIFICATION AS READ
export const markAsRead = async (req, res) => {
  try {
    const data = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { returnDocument: "after" }
    );

    if (!data) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const notification = {
      ...data.toObject(),
      _id: data._id,
      user: data.userId,
      trip: data.tripId
    };

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MARK ALL AS READ
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE NOTIFICATION
export const deleteNotification = async (req, res) => {
  try {
    const data = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!data) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CLEAR ALL NOTIFICATIONS
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });

    res.json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper utility to trigger notifications internally (with deduplication)
export const triggerNotification = async (userId, title, message, type = "info", tripId = null) => {
  try {
    // Deduplication: skip if identical notification was created in the last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const existing = await Notification.findOne({
      userId,
      title,
      message,
      createdAt: { $gte: sixtySecondsAgo }
    });

    if (existing) return;

    const created = await Notification.create({
      userId,
      title,
      message,
      type,
      tripId: tripId || null
    });

    // Push in real-time via Socket.IO — eliminates need for client polling
    pushToSocket(userId, {
      ...created.toObject(),
      _id: created._id,
      user: created.userId,
      trip: created.tripId
    });
  } catch (err) {
    console.error("Failed to trigger notification:", err);
  }
};
