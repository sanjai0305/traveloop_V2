import { supabase } from "../config/supabase.js";

const Note = {
  find: async (query = {}) => {
    let q = supabase.from("notes").select("*");
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    const { data } = await q;
    return (data || []).map(r => ({ ...r, _id: r.id, trip: r.tripId }));
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      trip: data.tripId,
      save: async function() {
        const { id, _id, trip, ...fields } = this;
        delete fields.save;
        await supabase.from("notes").update(fields).eq("id", id);
      }
    };
  },
  create: async (payload) => {
    const mapped = {
      tripId: payload.trip,
      title: payload.title,
      content: payload.content,
      userId: payload.userId || null,
    };
    const { data, error } = await supabase.from("notes").insert([mapped]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      trip: data.tripId,
      save: async function() {
        const { id, _id, trip, ...fields } = this;
        delete fields.save;
        await supabase.from("notes").update(fields).eq("id", id);
      }
    };
  },
  findByIdAndUpdate: async (id, updateFields, options) => {
    const mapped = { ...updateFields };
    if (mapped.trip) {
      mapped.tripId = mapped.trip;
      delete mapped.trip;
    }
    const { data, error } = await supabase.from("notes").update(mapped).eq("id", id).select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id, trip: data.tripId } : null;
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("notes").delete().eq("id", id);
    return true;
  },
  deleteMany: async (query = {}) => {
    let q = supabase.from("notes").delete();
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    await q;
    return { deletedCount: 1 };
  }
};

export default Note;