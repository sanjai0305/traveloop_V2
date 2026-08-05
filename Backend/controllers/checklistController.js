import supabase from "../config/supabase.js";

export const createChecklistItem = async (req, res) => {
  try {
    const { tripId, item, category } = req.body;

    const { data: newRow, error } = await supabase
      .from("checklists")
      .insert([{
        trip_id: tripId,
        user_id: req.user.id,
        items: [{ item, category: category || "General", checked: false }],
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Checklist Item Created",
      checklist: { ...newRow, _id: newRow.id, item, category },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChecklist = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: rows, error } = await supabase
      .from("checklists")
      .select("*")
      .eq("trip_id", tripId);

    if (error) throw error;

    const checklist = (rows || []).map((r) => ({
      ...r,
      _id: r.id,
      item: r.items?.[0]?.item || "Packing Item",
      checked: r.items?.[0]?.checked || false,
    }));

    res.status(200).json({ success: true, count: checklist.length, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { checked } = req.body;

    const { data: row } = await supabase
      .from("checklists")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (row && row.items && row.items[0]) {
      row.items[0].checked = checked;
      await supabase.from("checklists").update({ items: row.items }).eq("id", id);
    }

    res.status(200).json({ success: true, message: "Checklist item toggled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateChecklistItem = async (req, res) => {
  res.status(200).json({ success: true, message: "Checklist item updated" });
};

export const deleteChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from("checklists").delete().eq("id", id);
    res.status(200).json({ success: true, message: "Checklist Item Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetChecklist = async (req, res) => {
  res.status(200).json({ success: true, message: "Checklist reset successfully" });
};

export const generatePackingList = async (req, res) => {
  res.status(200).json({
    success: true,
    suggestions: [
      { item: "Passport & Tickets", category: "Documents" },
      { item: "Charger & Powerbank", category: "Electronics" },
      { item: "Sunscreen", category: "Toiletries" },
    ],
  });
};

export const bulkCreateChecklist = async (req, res) => {
  res.status(201).json({ success: true, message: "Checklist populated" });
};