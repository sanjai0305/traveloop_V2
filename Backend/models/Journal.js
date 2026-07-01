import { supabase } from "../config/supabase.js";

const Journal = {
  find: async (query = {}) => {
    let q = supabase.from("journals").select("*");
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    const { data, error } = await q.order("day", { ascending: true });
    if (error) throw error;
    return (data || []).map(r => ({ ...r, _id: r.id, trip: r.tripId }));
  },
  findOne: async (query = {}) => {
    let q = supabase.from("journals").select("*");
    if (query._id) {
      q = q.eq("id", query._id);
    }
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, trip: data.tripId };
  },
  findById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase.from("journals").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      trip: data.tripId,
      save: async function() {
        const { id, _id, trip, ...fields } = this;
        delete fields.save;
        if (fields.tripId === undefined && trip) {
          fields.tripId = trip;
        }
        await supabase.from("journals").update(fields).eq("id", id);
      }
    };
  },
  create: async (payload) => {
    const mapped = {
      tripId: payload.trip,
      day: payload.day || 1,
      date: payload.date || null,
      title: payload.title,
      content: payload.content || "",
      photos: payload.photos || [],
      mood: payload.mood || "great",
      highlights: payload.highlights || [],
    };
    const { data, error } = await supabase.from("journals").insert([mapped]).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, trip: data.tripId };
  },
  findByIdAndUpdate: async (id, updateFields, options) => {
    const mapped = { ...updateFields };
    if (mapped.trip) {
      mapped.tripId = mapped.trip;
      delete mapped.trip;
    }
    const { data, error } = await supabase.from("journals").update(mapped).eq("id", id).select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id, trip: data.tripId } : null;
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("journals").delete().eq("id", id);
    return true;
  }
};

export default Journal;
