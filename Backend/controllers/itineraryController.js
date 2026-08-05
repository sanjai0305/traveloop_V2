import supabase from "../config/supabase.js";
import { recalculateBudget } from "../services/budgetSync.js";

export const createItinerary = async (req, res) => {
  try {
    const { trip: tripId, day, title, description, time, location, budget } = req.body;

    const { data: newRow, error } = await supabase
      .from("itineraries")
      .insert([{
        trip_id: tripId,
        day: parseInt(day) || 1,
        title,
        description: description || "",
        budget: Number(budget) || 0,
      }])
      .select()
      .single();

    if (error) throw error;
    const itinerary = { ...newRow, _id: newRow.id, trip: newRow.trip_id };

    await recalculateBudget(tripId);

    res.status(201).json({
      success: true,
      message: "Itinerary Item Created",
      itinerary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTripItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: rows, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("trip_id", tripId)
      .order("day", { ascending: 1 });

    if (error) throw error;

    const itinerary = (rows || []).map((r) => ({
      ...r,
      _id: r.id,
      trip: r.trip_id,
    }));

    res.status(200).json({ success: true, itinerary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, title, description, budget } = req.body;

    const updates = {};
    if (day !== undefined) updates.day = parseInt(day) || 1;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (budget !== undefined) updates.budget = Number(budget) || 0;

    const { data: updated, error } = await supabase
      .from("itineraries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    const itinerary = { ...updated, _id: updated.id, trip: updated.trip_id };

    await recalculateBudget(updated.trip_id);

    res.status(200).json({
      success: true,
      message: "Itinerary Item Updated",
      itinerary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: row } = await supabase
      .from("itineraries")
      .select("trip_id")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("itineraries").delete().eq("id", id);
    if (error) throw error;

    if (row?.trip_id) {
      await recalculateBudget(row.trip_id);
    }

    res.status(200).json({ success: true, message: "Itinerary Item Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};