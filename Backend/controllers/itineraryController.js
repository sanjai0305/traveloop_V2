import { supabase } from "../config/supabase.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";
import { calculateBudgetSummary } from "../utils/budgetHelper.js";
import { recalculateBudget } from "../services/budgetSync.js";

// CREATE ITINERARY ITEM
export const createItinerary = async (req, res) => {
  try {
    const { trip: tripId, day, time, title, place, category, budget, note } = req.body;

    const { data: tripRow } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = { ...tripRow, _id: tripRow.id, owner: tripRow.userId, user: tripRow.userId };

    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    if (budget !== undefined && Number(budget) < 0) {
      return res.status(400).json({ success: false, message: "Expense amount cannot be negative." });
    }

    const { data: activeBudget } = await supabase
      .from("budgets")
      .select("*")
      .eq("tripId", tripId)
      .eq("isArchived", false)
      .eq("isActive", true)
      .maybeSingle();

    const limitBudget = activeBudget ? activeBudget.totalBudget : (trip.budget || 0);

    const { data: listRows } = await supabase
      .from("itineraries")
      .select("*")
      .eq("tripId", tripId);

    const existingItems = (listRows || []).map(row => ({ ...row, _id: row.id, trip: row.tripId }));

    const { isBudgetExceeded } = calculateBudgetSummary(limitBudget, existingItems, null, budget);
    if (isBudgetExceeded) {
      return res.status(400).json({ success: false, message: "Trip budget exceeded." });
    }

    const { data: newItinerary, error } = await supabase
      .from("itineraries")
      .insert([{
        tripId,
        day: parseInt(day) || 1,
        title,
        description: note || "",
        time: time || "",
        place: place || "",
        category: category || "",
        budget: Number(budget) || 0,
      }])
      .select()
      .single();

    if (error) throw error;

    const itinerary = {
      ...newItinerary,
      _id: newItinerary.id,
      trip: newItinerary.tripId,
      note: newItinerary.description
    };

    // Automatically sync active budget planned totals
    await recalculateBudget(tripId);

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} added activity: "${title}" to Day ${day}`);

    res.status(201).json({
      success: true,
      message: "Itinerary Item Created",
      itinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ITINERARY ITEMS BY TRIP
export const getTripItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;

    const { data: tripRow } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = { ...tripRow, _id: tripRow.id, owner: tripRow.userId, user: tripRow.userId };

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this itinerary" });
    }

    const { data: listRows } = await supabase
      .from("itineraries")
      .select("*")
      .eq("tripId", tripId)
      .order("day", { ascending: true });

    const itinerary = (listRows || []).map(row => ({
      ...row,
      _id: row.id,
      trip: row.tripId,
      time: "",
      place: "",
      category: "",
      budget: 0,
      note: row.description
    }));

    res.status(200).json({
      success: true,
      itinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE ITINERARY ITEM
export const updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, time, title, place, category, budget, note } = req.body;

    const { data: row } = await supabase
      .from("itineraries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Itinerary Item not found",
      });
    }

    const itineraryItem = {
      ...row,
      _id: row.id,
      trip: row.tripId,
      note: row.description
    };

    const { data: tripRow } = await supabase
      .from("trips")
      .select("*")
      .eq("id", itineraryItem.trip)
      .maybeSingle();

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    const trip = { ...tripRow, _id: tripRow.id, owner: tripRow.userId, user: tripRow.userId };

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    if (budget !== undefined && Number(budget) < 0) {
      return res.status(400).json({ success: false, message: "Expense amount cannot be negative." });
    }

    if (budget !== undefined) {
      const { data: activeBudget } = await supabase
        .from("budgets")
        .select("*")
        .eq("tripId", itineraryItem.trip)
        .eq("isArchived", false)
        .eq("isActive", true)
        .maybeSingle();

      const limitBudget = activeBudget ? activeBudget.totalBudget : (trip.budget || 0);

      const { data: listRows } = await supabase
        .from("itineraries")
        .select("*")
        .eq("tripId", itineraryItem.trip);

      const existingItems = (listRows || []).map(r => ({ ...r, _id: r.id, trip: r.tripId }));

      const { isBudgetExceeded } = calculateBudgetSummary(limitBudget, existingItems, id, budget);
      if (isBudgetExceeded) {
        return res.status(400).json({ success: false, message: "Trip budget exceeded." });
      }
    }

    const updateFields = {};
    if (day !== undefined) updateFields.day = parseInt(day) || 1;
    if (title !== undefined) updateFields.title = title;
    if (note !== undefined) updateFields.description = note;
    if (time !== undefined) updateFields.time = time;
    if (place !== undefined) updateFields.place = place;
    if (category !== undefined) updateFields.category = category;
    if (budget !== undefined) updateFields.budget = Number(budget) || 0;

    const { data: updatedRow, error } = await supabase
      .from("itineraries")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const itinerary = {
      ...updatedRow,
      _id: updatedRow.id,
      trip: updatedRow.tripId,
      note: updatedRow.description
    };

    // Automatically sync active budget planned totals
    await recalculateBudget(itineraryItem.trip);

    const userName = req.user.firstName || req.user.email;
    await logActivity(itineraryItem.trip, req.user.id, `${userName} updated activity: "${title || itineraryItem.title}" on Day ${itineraryItem.day}`);

    res.status(200).json({
      success: true,
      message: "Itinerary Item Updated",
      itinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE ITINERARY ITEM
export const deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: row } = await supabase
      .from("itineraries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Itinerary Item not found",
      });
    }

    const itineraryItem = {
      ...row,
      _id: row.id,
      trip: row.tripId,
      note: row.description
    };

    const { data: tripRow } = await supabase
      .from("trips")
      .select("*")
      .eq("id", itineraryItem.trip)
      .maybeSingle();

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    const trip = { ...tripRow, _id: tripRow.id, owner: tripRow.userId, user: tripRow.userId };

    if (!hasTripPermission(trip, req.user.id, "delete")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    const userName = req.user.firstName || req.user.email;
    await logActivity(itineraryItem.trip, req.user.id, `${userName} deleted activity: "${itineraryItem.title}" from Day ${itineraryItem.day}`);

    await supabase
      .from("itineraries")
      .delete()
      .eq("id", id);

    // Automatically sync active budget planned totals
    await recalculateBudget(itineraryItem.trip);

    res.status(200).json({
      success: true,
      message: "Itinerary Item Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};