import supabase from "../config/supabase.js";

const mapCategory = (cat) => {
  if (!cat) return "misc";
  const c = cat.toLowerCase();
  if (c === "stay" || c === "accommodation") return "accommodation";
  if (c === "transport" || c === "flight" || c === "cab") return "transport";
  if (c === "food" || c === "restaurant" || c === "dining") return "food";
  if (c === "activities" || c === "sightseeing") return "activities";
  if (c === "shopping") return "shopping";
  return "misc";
};

/**
 * Recalculates planned and actual expenses for the active budget in Supabase.
 * @param {string} tripId - The ID of the trip to sync.
 */
export const recalculateBudget = async (tripId) => {
  try {
    const { data: activeBudget } = await supabase
      .from("budgets")
      .select("*")
      .eq("trip_id", tripId)
      .maybeSingle();

    if (!activeBudget) return;

    const { data: itineraryItems } = await supabase
      .from("itineraries")
      .select("*")
      .eq("trip_id", tripId);

    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (!trip) return;

    let totalPlanned = 0;
    const categories = {
      transport: { planned: 0, actual: 0 },
      accommodation: { planned: 0, actual: 0 },
      food: { planned: 0, actual: 0 },
      activities: { planned: 0, actual: 0 },
      shopping: { planned: 0, actual: 0 },
      misc: { planned: 0, actual: 0 },
    };

    for (const item of itineraryItems || []) {
      const amt = Number(item.budget) || 0;
      totalPlanned += amt;
      const catKey = mapCategory(item.category);
      categories[catKey].planned += amt;
    }

    let totalActual = 0;
    const expenseList = activeBudget.expenses || [];
    for (const exp of expenseList) {
      const amt = Number(exp.amount) || Number(exp.convertedAmount) || 0;
      totalActual += amt;
      const catKey = mapCategory(exp.category);
      categories[catKey].actual += amt;
    }

    const remainingBudget = Number(activeBudget.total_budget || 0) - totalPlanned;

    await supabase
      .from("budgets")
      .update({
        categories,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeBudget.id);
  } catch (err) {
    console.error("Error running recalculateBudget:", err);
  }
};
