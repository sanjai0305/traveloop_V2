import { supabase } from "../config/supabase.js";

const Checklist = {
  find: async (query = {}) => {
    let q = supabase.from("checklists").select("*");
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    if (query.userId) {
      q = q.eq("userId", query.userId);
    }
    const { data } = await q;
    return (data || []).map(r => ({ ...r, _id: r.id, trip: r.tripId, item: r.itemName, checked: r.packed }));
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("checklists").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      trip: data.tripId,
      item: data.itemName,
      checked: data.packed,
      save: async function() {
        await supabase.from("checklists").update({ itemName: this.item, packed: this.checked, category: this.category }).eq("id", this.id);
      }
    };
  },
  create: async (payload) => {
    const mapped = {
      tripId: payload.trip,
      userId: payload.userId,
      itemName: payload.item,
      category: payload.category || "General",
      packed: payload.checked || false,
    };
    const { data, error } = await supabase.from("checklists").insert([mapped]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      trip: data.tripId,
      item: data.itemName,
      checked: data.packed,
    };
  },
  insertMany: async (docs) => {
    const inserts = docs.map(d => ({
      tripId: d.trip,
      userId: d.userId,
      itemName: d.item,
      category: d.category || "General",
      packed: d.checked || false,
    }));
    const { data, error } = await supabase.from("checklists").insert(inserts).select();
    if (error) throw error;
    return (data || []).map(r => ({ ...r, _id: r.id, trip: r.tripId, item: r.itemName, checked: r.packed }));
  },
  updateMany: async (query, updateFields) => {
    const packed = updateFields.checked !== undefined ? updateFields.checked : (updateFields.packed !== undefined ? updateFields.packed : false);
    let q = supabase.from("checklists").update({ packed });
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    const { data } = await q;
    return data;
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("checklists").delete().eq("id", id);
    return true;
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("checklists").delete();
    if (filter.trip) {
      if (filter.trip.$in) {
        q = q.in("tripId", filter.trip.$in);
      } else {
        q = q.eq("tripId", filter.trip);
      }
    } else {
      q = q.not("id", "is", "null");
    }
    const { error } = await q;
    if (error) throw error;
    return { deletedCount: 1 };
  }
};

export default Checklist;