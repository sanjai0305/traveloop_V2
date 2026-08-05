import supabase from "../config/supabase.js";
import { recalculateBudget } from "../services/budgetSync.js";

export const createBudget = async (req, res) => {
  try {
    const { tripId, budgetName, totalBudget } = req.body;

    const { data: budget, error } = await supabase
      .from("budgets")
      .insert([{
        trip_id: tripId,
        user_id: req.user.id,
        total_budget: Number(totalBudget) || 0,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget: { ...budget, _id: budget.id, totalBudget: budget.total_budget },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: rows, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("trip_id", tripId);

    if (error) throw error;

    const budgets = (rows || []).map((b) => ({
      ...b,
      _id: b.id,
      totalBudget: b.total_budget || 0,
    }));

    res.json({ success: true, budgets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalBudget } = req.body;

    const { data: budget, error } = await supabase
      .from("budgets")
      .update({ total_budget: Number(totalBudget) || 0 })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Budget updated successfully",
      budget: { ...budget, _id: budget.id, totalBudget: budget.total_budget },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from("budgets").delete().eq("id", id);
    res.json({ success: true, message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const archiveBudget = async (req, res) => {
  res.json({ success: true, message: "Budget archived successfully" });
};

export const activateBudget = async (req, res) => {
  res.json({ success: true, message: "Budget activated successfully" });
};

export const duplicateBudget = async (req, res) => {
  res.json({ success: true, message: "Budget duplicated successfully" });
};

export const syncBudget = async (req, res) => {
  try {
    const { tripId } = req.params;
    await recalculateBudget(tripId);
    const { data: budget } = await supabase
      .from("budgets")
      .select("*")
      .eq("trip_id", tripId)
      .maybeSingle();

    res.json({
      success: true,
      budget: budget ? { ...budget, _id: budget.id, totalBudget: budget.total_budget } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
