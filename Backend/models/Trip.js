import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const wrapTrip = (data) => {
  if (!data) return null;
  return {
    ...data,
    _id: data.id,
    owner: data.userId,
    user: data.userId,
    expenseItems: data.expenseItems || [],
    expenses: data.expenses || { transport: 0, accommodation: 0, food: 0, activities: 0, shopping: 0 },
    save: async function() {
      const { id, _id, save: _save, owner, user, ...fields } = this;
      if (fields.userId === undefined) {
        fields.userId = this.userId || owner || user;
      }
      // Clean up fields that aren't columns in the trips table
      delete fields.owner;
      delete fields.user;
      
      const { error } = await supabase.from("trips").update(fields).eq("id", id);
      if (error) throw error;
    }
  };
};

const Trip = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("trips").select("*");
      if (query.userId) {
        q = q.eq("userId", query.userId);
      }
      const { data } = await q;
      return (data || []).map(r => wrapTrip(r));
    })();
    return makeQueryChain(promise);
  },
  findOne: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("trips").select("*");
      if (query._id) {
        q = q.eq("id", query._id);
      }
      if (query.shareToken) {
        q = q.eq("shareToken", query.shareToken);
      }
      if (query.userId) {
        q = q.eq("userId", query.userId);
      }
      if (query.user) {
        q = q.eq("userId", query.user);
      }
      if (query.status) {
        q = q.eq("status", query.status);
      }
      const { data } = await q.maybeSingle();
      if (!data) return null;
      return wrapTrip(data);
    })();
    return makeQueryChain(promise);
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return wrapTrip(data);
  },
  create: async (payload) => {
    const mapped = {
      userId: payload.user || payload.owner || payload.userId,
      image: payload.image || "",
      title: payload.title,
      destination: payload.destination,
      startDate: payload.startDate || null,
      endDate: payload.endDate || null,
      budget: payload.budget || 0,
      isPublic: payload.isPublic || false,
      status: payload.status || "planning",
      collaborators: payload.collaborators || [],
      shareAnalytics: payload.shareAnalytics || { views: 0, visitors: 0, visitorCountries: [], lastViewed: null },
      expenseItems: payload.expenseItems || [],
      expenses: payload.expenses || { transport: 0, accommodation: 0, food: 0, activities: 0, shopping: 0 }
    };
    const { data, error } = await supabase.from("trips").insert([mapped]).select().single();
    if (error) throw error;
    return wrapTrip(data);
  },
  findByIdAndUpdate: async (id, updateFields, options) => {
    const fields = { ...updateFields };
    if (fields.user) {
      fields.userId = fields.user;
      delete fields.user;
    }
    if (fields.owner) {
      fields.userId = fields.owner;
      delete fields.owner;
    }
    const { data, error } = await supabase.from("trips").update(fields).eq("id", id).select().single();
    if (error) throw error;
    return wrapTrip(data);
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("trips").delete().eq("id", id);
    return true;
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("trips").delete();
    if (filter._id) {
      if (filter._id.$in) {
        q = q.in("id", filter._id.$in);
      } else {
        q = q.eq("id", filter._id);
      }
    } else {
      q = q.not("id", "is", "null");
    }
    const { error } = await q;
    if (error) throw error;
    return { deletedCount: 1 };
  }
};

export default Trip;