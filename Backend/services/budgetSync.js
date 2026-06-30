// services/budgetSync.js
import Budget from "../models/Budget.js";
import Itinerary from "../models/Itinerary.js";
import Trip from "../models/Trip.js";

/**
 * Recalculates planned expenses, actual expenses, remaining budget, and category breakdowns
 * for the active budget of a specific trip. Also synchronizes trip.budget with activeBudget.totalBudget.
 * @param {string} tripId - The ID of the trip to sync.
 */
export const recalculateBudget = async (tripId) => {
  try {
    // 1. Fetch active, non-archived budget for this trip
    const activeBudget = await Budget.findOne({ tripId, isArchived: false, isActive: true });
    if (!activeBudget) return;

    // 2. Fetch all itinerary items for this trip
    const itineraryItems = await Itinerary.find({ trip: tripId });

    // 3. Fetch the trip to get expenseItems
    const trip = await Trip.findById(tripId);
    if (!trip) return;

    // A. Calculate planned expenses from itinerary
    let totalPlanned = 0;
    const categoriesPlanned = {
      accommodation: 0,
      food: 0,
      transport: 0,
      activities: 0,
      shopping: 0,
      others: 0
    };

    for (const item of itineraryItems) {
      const cost = Number(item.budget) || 0;
      totalPlanned += cost;

      const rawCat = (item.category || "").toLowerCase();
      let targetCat = "others";
      if (rawCat === "stay" || rawCat === "accommodation") {
        targetCat = "accommodation";
      } else if (rawCat === "food" || rawCat === "coffee") {
        targetCat = "food";
      } else if (rawCat === "transport") {
        targetCat = "transport";
      } else if (rawCat === "activities" || rawCat === "sightseeing" || rawCat === "activity") {
        targetCat = "activities";
      } else if (rawCat === "shopping") {
        targetCat = "shopping";
      }

      categoriesPlanned[targetCat] += cost;
    }

    // B. Calculate actual expenses from trip expenseItems
    let totalActual = 0;
    const categoriesActual = {
      accommodation: 0,
      food: 0,
      transport: 0,
      activities: 0,
      shopping: 0,
      others: 0
    };

    if (trip.expenseItems && Array.isArray(trip.expenseItems)) {
      for (const exp of trip.expenseItems) {
        const cost = Number(exp.convertedAmount) || 0;
        totalActual += cost;

        const rawCat = (exp.category || "").toLowerCase();
        let targetCat = "others";
        if (rawCat === "accommodation" || rawCat === "stay") {
          targetCat = "accommodation";
        } else if (rawCat === "food" || rawCat === "coffee") {
          targetCat = "food";
        } else if (rawCat === "transport") {
          targetCat = "transport";
        } else if (rawCat === "activities" || rawCat === "sightseeing" || rawCat === "activity") {
          targetCat = "activities";
        } else if (rawCat === "shopping") {
          targetCat = "shopping";
        }

        categoriesActual[targetCat] += cost;
      }
    }

    // 4. Update the active budget fields
    activeBudget.plannedExpense = totalPlanned;
    activeBudget.actualExpense = totalActual;
    activeBudget.remainingBudget = activeBudget.totalBudget - totalActual;
    activeBudget.utilizationPercentage = activeBudget.totalBudget > 0
      ? (totalActual / activeBudget.totalBudget) * 100
      : 0;

    // Set category breakdowns
    for (const catKey of Object.keys(categoriesPlanned)) {
      activeBudget.categories[catKey] = {
        planned: categoriesPlanned[catKey],
        actual: categoriesActual[catKey]
      };
    }

    await activeBudget.save();

    // 5. Keep trip.budget synced with the active budget limit
    if (trip.budget !== activeBudget.totalBudget) {
      trip.budget = activeBudget.totalBudget;
      
      // Also update Mongoose trip.expenses fields to stay aligned for analytics
      trip.expenses = {
        transport: categoriesActual.transport,
        accommodation: categoriesActual.accommodation,
        food: categoriesActual.food,
        activities: categoriesActual.activities,
        shopping: categoriesActual.shopping
      };
      
      await trip.save();
    }
  } catch (err) {
    console.error("Error running recalculateBudget:", err);
  }
};
