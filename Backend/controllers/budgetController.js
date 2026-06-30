// controllers/budgetController.js
import Budget from "../models/Budget.js";
import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import { hasTripPermission } from "../utils/permissionHelper.js";
import { recalculateBudget } from "../services/budgetSync.js";

// CREATE BUDGET
export const createBudget = async (req, res) => {
  try {
    const { tripId, budgetName, totalBudget, currency, category } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to modify this trip" });
    }

    // Set other budgets for this trip to inactive
    await Budget.updateMany({ tripId }, { isActive: false });

    const budget = await Budget.create({
      userId: req.user.id,
      tripId,
      budgetName,
      totalBudget: Number(totalBudget) || 0,
      currency: currency || "INR",
      category: category || "",
      isActive: true,
    });

    // Run initial sync to calculate planned/actual expenses
    await recalculateBudget(tripId);

    // Sync trip.budget
    trip.budget = Number(totalBudget) || 0;
    await trip.save();

    const updatedBudget = await Budget.findById(budget._id);

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget: updatedBudget
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL BUDGETS FOR A TRIP
export const getBudgets = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to view this trip" });
    }

    let budgets = await Budget.find({ tripId });

    // Bootstrapping: if no budgets exist, automatically create a default one
    if (budgets.length === 0) {
      const defaultBudget = await Budget.create({
        userId: trip.owner || trip.user || req.user.id,
        tripId,
        budgetName: `${trip.title} Budget`,
        totalBudget: trip.budget || 0,
        currency: "INR",
        isActive: true,
      });

      await recalculateBudget(tripId);
      budgets = [await Budget.findById(defaultBudget._id)];
    }

    res.json({
      success: true,
      budgets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE BUDGET
export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { budgetName, totalBudget, currency, category } = req.body;

    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const trip = await Trip.findById(budget.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to modify this trip" });
    }

    // Validation: If new totalBudget is lower than current planned or actual expenses
    if (totalBudget !== undefined) {
      const newLimit = Number(totalBudget) || 0;
      if (newLimit < 0) {
        return res.status(400).json({ success: false, message: "Budget amount cannot be negative." });
      }
      if (budget.plannedExpense > newLimit || budget.actualExpense > newLimit) {
        return res.status(400).json({ success: false, message: "Trip budget exceeded" });
      }
      budget.totalBudget = newLimit;
    }

    if (budgetName !== undefined) budget.budgetName = budgetName;
    if (currency !== undefined) budget.currency = currency;
    if (category !== undefined) budget.category = category;

    await budget.save();

    // Recalculate to verify and update remainders
    await recalculateBudget(budget.tripId);

    const updatedBudget = await Budget.findById(id);

    res.json({
      success: true,
      message: "Budget updated successfully",
      budget: updatedBudget
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE BUDGET
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const trip = await Trip.findById(budget.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "delete")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to delete this budget" });
    }

    const wasActive = budget.isActive;
    const tripId = budget.tripId;

    await Budget.findByIdAndDelete(id);

    // If deleted budget was active, auto-activate another remaining budget
    if (wasActive) {
      const another = await Budget.findOne({ tripId, isArchived: false });
      if (another) {
        another.isActive = true;
        await another.save();
        await recalculateBudget(tripId);
      }
    }

    res.json({
      success: true,
      message: "Budget deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ARCHIVE / RESTORE BUDGET (Toggle isArchived)
export const archiveBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const trip = await Trip.findById(budget.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to modify this trip" });
    }

    budget.isArchived = !budget.isArchived;

    // If we archived an active budget, set isActive to false and find another non-archived to activate
    if (budget.isArchived && budget.isActive) {
      budget.isActive = false;
      await budget.save();

      const another = await Budget.findOne({ tripId: budget.tripId, isArchived: false });
      if (another) {
        another.isActive = true;
        await another.save();
        await recalculateBudget(budget.tripId);
      }
    } else {
      await budget.save();
    }

    res.json({
      success: true,
      message: budget.isArchived ? "Budget archived successfully" : "Budget restored successfully",
      budget
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ACTIVATE BUDGET
export const activateBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const trip = await Trip.findById(budget.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to modify this trip" });
    }

    // Set other budgets for this trip to inactive
    await Budget.updateMany({ tripId: budget.tripId }, { isActive: false });

    budget.isActive = true;
    budget.isArchived = false; // Restore if it was archived
    await budget.save();

    await recalculateBudget(budget.tripId);

    const updatedBudget = await Budget.findById(id);

    res.json({
      success: true,
      message: "Budget activated successfully",
      budget: updatedBudget
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DUPLICATE BUDGET
export const duplicateBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const sourceBudget = await Budget.findById(id);
    if (!sourceBudget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const trip = await Trip.findById(sourceBudget.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to duplicate this budget" });
    }

    // Deactivate others
    await Budget.updateMany({ tripId: sourceBudget.tripId }, { isActive: false });

    const duplicate = await Budget.create({
      userId: req.user.id,
      tripId: sourceBudget.tripId,
      budgetName: `${sourceBudget.budgetName} (copy)`,
      totalBudget: sourceBudget.totalBudget,
      currency: sourceBudget.currency,
      category: sourceBudget.category,
      isActive: true,
    });

    // Run recalculation to sync planned/actual breakdown
    await recalculateBudget(sourceBudget.tripId);

    const updatedDuplicate = await Budget.findById(duplicate._id);

    res.status(201).json({
      success: true,
      message: "Budget duplicated successfully",
      budget: updatedDuplicate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
