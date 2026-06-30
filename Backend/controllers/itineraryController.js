import Itinerary from "../models/Itinerary.js";
import Trip from "../models/Trip.js";
import Budget from "../models/Budget.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";
import { calculateBudgetSummary } from "../utils/budgetHelper.js";
import { recalculateBudget } from "../services/budgetSync.js";

// CREATE ITINERARY ITEM
export const createItinerary = async (req, res) => {
  try {
    const { trip: tripId, day, time, title, place, category, budget, note } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    if (budget !== undefined && Number(budget) < 0) {
      return res.status(400).json({ success: false, message: "Expense amount cannot be negative." });
    }

    const activeBudget = await Budget.findOne({ tripId, isArchived: false, isActive: true });
    const limitBudget = activeBudget ? activeBudget.totalBudget : (trip.budget || 0);

    const existingItems = await Itinerary.find({ trip: tripId });
    const { isBudgetExceeded } = calculateBudgetSummary(limitBudget, existingItems, null, budget);
    if (isBudgetExceeded) {
      return res.status(400).json({ success: false, message: "Trip budget exceeded" });
    }

    const itinerary = await Itinerary.create({
      trip: tripId,
      day,
      time,
      title,
      place,
      category,
      budget,
      note,
    });

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
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this itinerary" });
    }

    const itinerary = await Itinerary.find({
      trip: tripId,
    }).sort({ day: 1, time: 1 });

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

    const itineraryItem = await Itinerary.findById(id);
    if (!itineraryItem) {
      return res.status(404).json({
        success: false,
        message: "Itinerary Item not found",
      });
    }

    const trip = await Trip.findById(itineraryItem.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    if (budget !== undefined && Number(budget) < 0) {
      return res.status(400).json({ success: false, message: "Expense amount cannot be negative." });
    }

    if (budget !== undefined) {
      const activeBudget = await Budget.findOne({ tripId: itineraryItem.trip, isArchived: false, isActive: true });
      const limitBudget = activeBudget ? activeBudget.totalBudget : (trip.budget || 0);

      const existingItems = await Itinerary.find({ trip: itineraryItem.trip });
      const { isBudgetExceeded } = calculateBudgetSummary(limitBudget, existingItems, id, budget);
      if (isBudgetExceeded) {
        return res.status(400).json({ success: false, message: "Trip budget exceeded" });
      }
    }

    const updateFields = {};
    if (day !== undefined) updateFields.day = day;
    if (time !== undefined) updateFields.time = time;
    if (title !== undefined) updateFields.title = title;
    if (place !== undefined) updateFields.place = place;
    if (category !== undefined) updateFields.category = category;
    if (budget !== undefined) updateFields.budget = budget;
    if (note !== undefined) updateFields.note = note;

    const itinerary = await Itinerary.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

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

    const itineraryItem = await Itinerary.findById(id);
    if (!itineraryItem) {
      return res.status(404).json({
        success: false,
        message: "Itinerary Item not found",
      });
    }

    const trip = await Trip.findById(itineraryItem.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "delete")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    const userName = req.user.firstName || req.user.email;
    await logActivity(itineraryItem.trip, req.user.id, `${userName} deleted activity: "${itineraryItem.title}" from Day ${itineraryItem.day}`);

    await Itinerary.findByIdAndDelete(id);

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