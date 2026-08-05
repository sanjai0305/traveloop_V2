import supabase from "../config/supabase.js";

export const getJournalEntries = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: rows, error } = await supabase
      .from("journals")
      .select("*")
      .eq("trip_id", tripId)
      .order("day", { ascending: 1 });

    if (error) throw error;
    const entries = (rows || []).map((j) => ({ ...j, _id: j.id }));
    res.status(200).json({ success: true, entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJournalEntry = async (req, res) => {
  try {
    const { tripId, day, title, content } = req.body;
    const targetTripId = tripId || req.body.trip;

    const { data: entry, error } = await supabase
      .from("journals")
      .insert([{
        trip_id: targetTripId,
        user_id: req.user.id,
        day: Number(day || 1),
        title: (title || "Journal Entry").trim(),
        content: content || "",
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: "Journal entry saved successfully.", entry: { ...entry, _id: entry.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const { data: entry, error } = await supabase
      .from("journals")
      .update({ title, content })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, message: "Journal entry updated successfully.", entry: { ...entry, _id: entry.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("journals").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ success: true, message: "Journal entry deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
