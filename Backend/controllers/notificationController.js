import { supabase } from "../config/supabase.js";

// GET ALL NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("userId", req.user.id)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    const notifications = (data || []).map(r => ({
      ...r,
      _id: r.id,
      user: r.userId,
      trip: r.tripId
    }));

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
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", req.params.id)
      .eq("userId", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const notification = { ...data, _id: data.id, user: data.userId, trip: data.tripId };
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
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("userId", req.user.id)
      .eq("read", false);

    if (error) throw error;

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
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", req.params.id)
      .eq("userId", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
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
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("userId", req.user.id);

    if (error) throw error;

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
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: existing, error: checkError } = await supabase
      .from("notifications")
      .select("id")
      .eq("userId", userId)
      .eq("title", title)
      .eq("message", message)
      .gte("createdAt", sixtySecondsAgo)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) return;

    const payload = {
      userId,
      title,
      message,
      type,
      tripId: tripId || null
    };

    const { error: insertError } = await supabase
      .from("notifications")
      .insert([payload]);

    if (insertError) throw insertError;
  } catch (err) {
    console.error("Failed to trigger notification:", err);
  }
};
