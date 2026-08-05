import supabase from "../config/supabase.js";

export const createNote = async (req, res) => {
  try {
    const { trip: tripId, title, content, day, pinned, tags, type } = req.body;

    const { data: note, error } = await supabase
      .from("notes")
      .insert([{
        trip_id: tripId,
        title,
        content,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Note Created",
      note: { ...note, _id: note.id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: rows, error } = await supabase
      .from("notes")
      .select("*")
      .eq("trip_id", tripId);

    if (error) throw error;

    const notes = (rows || []).map((n) => ({ ...n, _id: n.id }));
    res.status(200).json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const { data: note, error } = await supabase
      .from("notes")
      .update({ title, content })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Note Updated",
      note: { ...note, _id: note.id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ success: true, message: "Note Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};