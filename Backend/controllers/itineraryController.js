import Trip from "../models/Trip.js";
import Budget from "../models/Budget.js";
import Itinerary from "../models/Itinerary.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";
import { calculateBudgetSummary } from "../utils/budgetHelper.js";
import { recalculateBudget } from "../services/budgetSync.js";

// CREATE ITINERARY ITEM
export const createItinerary = async (req, res) => {
  try {
    const { trip: tripId, day, time, title, place, category, budget, note } = req.body;

    const tripRow = await Trip.findById(tripId);
    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    if (budget !== undefined && Number(budget) < 0) {
      return res.status(400).json({ success: false, message: "Expense amount cannot be negative." });
    }

    const activeBudget = await Budget.findOne({
      tripId,
      isArchived: false,
      isActive: true,
    });

    const limitBudget = activeBudget ? activeBudget.totalBudget : (trip.budget || 0);

    const listRows = await Itinerary.find({ tripId });
    const existingItems = (listRows || []).map(row => {
      const obj = row.toObject ? row.toObject() : row;
      return { ...obj, _id: row._id, trip: row.tripId };
    });

    const { isBudgetExceeded } = calculateBudgetSummary(limitBudget, existingItems, null, budget);
    if (isBudgetExceeded) {
      return res.status(400).json({ success: false, message: "Trip budget exceeded." });
    }

    const newItinerary = await Itinerary.create({
      tripId,
      day: parseInt(day) || 1,
      title,
      description: note || "",
      note: note || "",
      time: time || "",
      place: place || "",
      category: category || "",
      budget: Number(budget) || 0,
    });

    const itinerary = {
      ...newItinerary.toObject(),
      _id: newItinerary._id,
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

    const tripRow = await Trip.findById(tripId);
    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this itinerary" });
    }

    const listRows = await Itinerary.find({ tripId }).sort({ day: 1 });

    const itinerary = (listRows || []).map(row => {
      const obj = row.toObject ? row.toObject() : row;
      return {
        ...obj,
        _id: row._id,
        trip: row.tripId,
        time: obj.time || "",
        place: obj.place || "",
        category: obj.category || "",
        budget: obj.budget || 0,
        note: obj.description || obj.note || ""
      };
    });

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

    const row = await Itinerary.findById(id);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Itinerary Item not found",
      });
    }

    const itineraryItem = {
      ...row.toObject(),
      _id: row._id,
      trip: row.tripId,
      note: row.description
    };

    const tripRow = await Trip.findById(itineraryItem.trip);
    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this itinerary" });
    }

    if (budget !== undefined && Number(budget) < 0) {
      return res.status(400).json({ success: false, message: "Expense amount cannot be negative." });
    }

    if (budget !== undefined) {
      const activeBudget = await Budget.findOne({
        tripId: itineraryItem.trip,
        isArchived: false,
        isActive: true,
      });

      const limitBudget = activeBudget ? activeBudget.totalBudget : (trip.budget || 0);

      const listRows = await Itinerary.find({ tripId: itineraryItem.trip });
      const existingItems = (listRows || []).map(r => {
        const obj = r.toObject ? r.toObject() : r;
        return { ...obj, _id: r._id, trip: r.tripId };
      });

      const { isBudgetExceeded } = calculateBudgetSummary(limitBudget, existingItems, id, budget);
      if (isBudgetExceeded) {
        return res.status(400).json({ success: false, message: "Trip budget exceeded." });
      }
    }

    const updateFields = {};
    if (day !== undefined) updateFields.day = parseInt(day) || 1;
    if (title !== undefined) updateFields.title = title;
    if (note !== undefined) {
      updateFields.description = note;
      updateFields.note = note;
    }
    if (time !== undefined) updateFields.time = time;
    if (place !== undefined) updateFields.place = place;
    if (category !== undefined) updateFields.category = category;
    if (budget !== undefined) updateFields.budget = Number(budget) || 0;

    const updatedRow = await Itinerary.findByIdAndUpdate(id, updateFields, { returnDocument: "after" });

    const itinerary = {
      ...updatedRow.toObject(),
      _id: updatedRow._id,
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

    const row = await Itinerary.findById(id);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Itinerary Item not found",
      });
    }

    const itineraryItem = {
      ...row.toObject(),
      _id: row._id,
      trip: row.tripId,
      note: row.description
    };

    const tripRow = await Trip.findById(itineraryItem.trip);
    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

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