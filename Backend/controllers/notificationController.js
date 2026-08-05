import supabase from "../config/supabase.js";

export let _io = null;
export const setIo = (io) => { _io = io; };

const pushToSocket = (userId, notification) => {
  if (_io && userId) {
    _io.to(`user_${userId.toString()}`).emit("notification", notification);
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: rows, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const notifications = (rows || []).map((r) => ({
      ...r,
      _id: r.id,
      userId: r.user_id,
      title: r.title,
      message: r.message,
      read: r.read,
      createdAt: r.created_at,
    }));

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: updated } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .select()
      .single();

    res.json({ success: true, notification: updated ? { ...updated, _id: updated.id } : null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from("notifications").delete().eq("id", id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await supabase.from("notifications").delete().eq("user_id", userId);
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerNotification = async (userId, title, message, type = "info", tripId = null) => {
  try {
    const { data: created } = await supabase
      .from("notifications")
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        read: false,
      }])
      .select()
      .single();

    if (created) {
      pushToSocket(userId, { ...created, _id: created.id });
    }
  } catch (err) {
    console.error("Failed to trigger notification:", err);
  }
};
