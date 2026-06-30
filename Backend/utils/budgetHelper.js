// utils/budgetHelper.js

/**
 * Calculates budget summary based on trip budget and list of itinerary items.
 * @param {number} tripBudget - The allocated budget for the trip.
 * @param {Array} itineraryItems - The array of itinerary items.
 * @param {string|null} excludeItemId - An item ID to exclude (e.g. when editing/updating an item, to calculate the sum of other items).
 * @param {number} pendingAmount - An amount to add to the sum (e.g. the new/modified amount of the current item being edited/validated).
 * @returns {Object} The budget summary.
 */
export const calculateBudgetSummary = (tripBudget, itineraryItems, excludeItemId = null, pendingAmount = 0) => {
  const totalBudget = Number(tripBudget) || 0;
  
  let totalPlannedExpenses = 0;
  if (Array.isArray(itineraryItems)) {
    for (const item of itineraryItems) {
      if (!item) continue;
      
      const itemId = item._id || item.id;
      if (excludeItemId && itemId && itemId.toString() === excludeItemId.toString()) {
        continue;
      }
      totalPlannedExpenses += Number(item.budget) || 0;
    }
  }
  
  totalPlannedExpenses += Number(pendingAmount) || 0;
  
  const remainingBudget = totalBudget - totalPlannedExpenses;
  const isBudgetExceeded = totalPlannedExpenses > totalBudget;
  
  return {
    totalBudget,
    totalPlannedExpenses,
    remainingBudget,
    isBudgetExceeded
  };
};
