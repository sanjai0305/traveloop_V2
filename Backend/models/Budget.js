import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const wrapBudget = (data) => {
  if (!data) return null;
  return {
    ...data,
    _id: data.id,
    user: data.userId,
    trip: data.tripId,
    totalBudget: Number(data.totalBudget) || 0,
    plannedExpense: Number(data.plannedExpense) || 0,
    actualExpense: Number(data.actualExpense) || 0,
    remainingBudget: Number(data.remainingBudget) || 0,
    save: async function() {
      const { id, _id, save: _save, user, trip, ...fields } = this;
      fields.userId = this.userId || user || undefined;
      fields.tripId = this.tripId || trip || undefined;
      const { error } = await supabase.from("budgets").update(fields).eq("id", id);
      if (error) throw error;
    }
  };
};

const Budget = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("budgets").select("*");
      if (query.tripId) {
        q = q.eq("tripId", query.tripId);
      }
      if (query.trip) {
        q = q.eq("tripId", query.trip);
      }
      if (query.isActive !== undefined) {
        q = q.eq("isActive", query.isActive);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => wrapBudget(r));
    })();
    return makeQueryChain(promise);
  },
  findOne: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("budgets").select("*");
      if (query.tripId) {
        q = q.eq("tripId", query.tripId);
      }
      if (query.trip) {
        q = q.eq("tripId", query.trip);
      }
      if (query.isArchived !== undefined) {
        q = q.eq("isArchived", query.isArchived);
      }
      if (query.isActive !== undefined) {
        q = q.eq("isActive", query.isActive);
      }
      const { data } = await q.maybeSingle();
      if (!data) return null;
      return wrapBudget(data);
    })();
    return makeQueryChain(promise);
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("budgets").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return wrapBudget(data);
  },
  create: async (payload) => {
    const mapped = {
      tripId: payload.tripId || payload.trip,
      userId: payload.userId || payload.user || null,
      budgetName: payload.budgetName || "",
      totalBudget: Number(payload.totalBudget) || 0,
      currency: payload.currency || "INR",
      category: payload.category || "",
      isArchived: payload.isArchived || false,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    };
    const { data, error } = await supabase.from("budgets").insert([mapped]).select().single();
    if (error) throw error;
    return wrapBudget(data);
  },
  updateMany: async (filter = {}, updateFields = {}) => {
    let q = supabase.from("budgets").update(updateFields);
    if (filter.tripId) {
      q = q.eq("tripId", filter.tripId);
    }
    if (filter.trip) {
      q = q.eq("tripId", filter.trip);
    }
    const { error } = await q;
    if (error) throw error;
    return { modifiedCount: 1 };
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("budgets").delete();
    if (filter.tripId) {
      q = q.eq("tripId", filter.tripId);
    } else if (filter.trip) {
      q = q.eq("tripId", filter.trip);
    } else {
      q = q.not("id", "is", "null");
    }
    const { error } = await q;
    if (error) throw error;
    return { deletedCount: 1 };
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("budgets").delete().eq("id", id);
    return true;
  }
};

export default Budget;
