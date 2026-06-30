import Notification from "../models/Notification.js";

// GET ALL NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
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
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
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
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
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
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!notification) {
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
    await Notification.deleteMany({ user: req.user.id });
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
    // ── DEDUPLICATION: skip if identical notification was created in the last 60 seconds ──
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const existing = await Notification.findOne({
      user: userId,
      title,
      message,
      createdAt: { $gte: sixtySecondsAgo },
    });
    if (existing) {
      // Duplicate found — skip creation silently
      return;
    }

    const payload = {
      user: userId,
      title,
      message,
      type,
    };
    if (tripId) {
      payload.trip = tripId;
    }
    await Notification.create(payload);
  } catch (err) {
    console.error("Failed to trigger notification:", err);
  }
};
