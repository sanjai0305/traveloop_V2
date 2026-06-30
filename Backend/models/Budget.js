import { supabase } from "../config/supabase.js";

const Budget = {
  findOne: async (query = {}) => {
    let q = supabase.from("budgets").select("*");
    if (query.tripId) {
      q = q.eq("tripId", query.tripId);
    }
    if (query.isArchived !== undefined) {
      q = q.eq("isArchived", query.isArchived);
    }
    if (query.isActive !== undefined) {
      q = q.eq("isActive", query.isActive);
    }
    const { data } = await q.maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        await supabase.from("budgets").update({ totalBudget: this.totalBudget, isArchived: this.isArchived, isActive: this.isActive }).eq("id", this.id);
      }
    };
  },
  create: async (payload) => {
    const mapped = {
      tripId: payload.tripId,
      totalBudget: payload.totalBudget || 0,
      isArchived: payload.isArchived || false,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    };
    const { data, error } = await supabase.from("budgets").insert([mapped]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
    };
  }
};

export default Budget;
