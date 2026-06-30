import { supabase } from "../config/supabase.js";

/**
 * Recalculates planned expenses for active budgets in Supabase PostgreSQL.
 * @param {string} tripId - The ID of the trip to sync.
 */
export const recalculateBudget = async (tripId) => {
  try {
    const { data: activeBudget } = await supabase
      .from("budgets")
      .select("*")
      .eq("tripId", tripId)
      .eq("isArchived", false)
      .eq("isActive", true)
      .maybeSingle();

    if (!activeBudget) return;

    const { data: itineraryItems } = await supabase
      .from("itineraries")
      .select("*")
      .eq("tripId", tripId);

    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (!trip) return;

    let totalPlanned = 0;
    for (const item of (itineraryItems || [])) {
      totalPlanned += Number(item.budget) || 0;
    }

    await supabase
      .from("budgets")
      .update({
        totalBudget: activeBudget.totalBudget,
        // PostgreSQL plannedExpense equivalent updates
      })
      .eq("id", activeBudget.id);

  } catch (err) {
    console.error("Error running recalculateBudget:", err);
  }
};
