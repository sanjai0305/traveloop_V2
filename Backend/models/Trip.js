import { supabase } from "../config/supabase.js";

const Trip = {
  find: async (query = {}) => {
    let q = supabase.from("trips").select("*");
    if (query.userId) {
      q = q.eq("userId", query.userId);
    }
    const { data } = await q;
    return (data || []).map(r => ({ ...r, _id: r.id }));
  },
  findOne: async (query = {}) => {
    let q = supabase.from("trips").select("*");
    if (query._id) {
      q = q.eq("id", query._id);
    }
    const { data } = await q.maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("trips").update(fields).eq("id", id);
      }
    };
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("trips").update(fields).eq("id", id);
      }
    };
  },
  create: async (payload) => {
    const mapped = {
      userId: payload.user || payload.owner,
      image: payload.image || "",
      title: payload.title,
      destination: payload.destination,
      startDate: payload.startDate || null,
      endDate: payload.endDate || null,
      budget: payload.budget || 0,
      isPublic: payload.isPublic || false,
      status: payload.status || "planning",
    };
    const { data, error } = await supabase.from("trips").insert([mapped]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("trips").update(fields).eq("id", id);
      }
    };
  },
  findByIdAndUpdate: async (id, updateFields, options) => {
    const { data, error } = await supabase.from("trips").update(updateFields).eq("id", id).select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id } : null;
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("trips").delete().eq("id", id);
    return true;
  }
};

export default Trip;