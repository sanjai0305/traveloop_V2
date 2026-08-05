import supabase from "../config/supabase.js";

export const sendMessage = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { message } = req.body;

    const { data: newMsg, error } = await supabase
      .from("chat_messages")
      .insert([{
        trip_id: tripId,
        user_id: req.user.id,
        message: message || "",
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: { ...newMsg, _id: newMsg.id, tripId: newMsg.trip_id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const messages = (rows || []).map((m) => ({
      ...m,
      _id: m.id,
      tripId: m.trip_id,
      sender: m.user_id,
      senderName: "Traveler",
    }));

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reactToMessage = async (req, res) => {
  res.json({ success: true, reactions: {} });
};

export const editMessage = async (req, res) => {
  res.json({ success: true, message: "Message edited" });
};

export const deleteMessage = async (req, res) => {
  res.json({ success: true, message: "Message deleted" });
};

export const updateLiveLocation = async (req, res) => {
  res.json({ success: true, message: "Location updated" });
};

export const getActiveLocations = async (req, res) => {
  res.json({ success: true, locations: [] });
};

export const votePoll = async (req, res) => {
  res.json({ success: true, poll: {} });
};

export const markExpensePaid = async (req, res) => {
  res.json({ success: true, expense: {} });
};

export const askAiAssistant = async (req, res) => {
  res.json({ success: true, aiMessage: { message: "AI response" } });
};

export const getSharedMedia = async (req, res) => {
  res.json({ success: true, items: [] });
};

export const sendChatNotification = (req, res) => res.json({ success: true });
export const markSeen = (req, res) => res.json({ success: true });
