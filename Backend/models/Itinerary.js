import { supabase } from "../config/supabase.js";

const Itinerary = {
  find: async (query = {}) => {
    let q = supabase.from("itineraries").select("*");
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    const { data } = await q;
    return (data || []).map(r => ({ ...r, _id: r.id, trip: r.tripId, note: r.description }));
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("itineraries").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      trip: data.tripId,
      note: data.description,
      save: async function() {
        await supabase.from("itineraries").update({ day: this.day, title: this.title, description: this.note }).eq("id", this.id);
      }
    };
  },
  create: async (payload) => {
    const mapped = {
      tripId: payload.trip,
      day: payload.day || 1,
      title: payload.title,
      description: payload.note || "",
      isAiSuggestion: payload.isAiSuggestion || false,
      aiSource: payload.aiSource || "",
    };
    const { data, error } = await supabase.from("itineraries").insert([mapped]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      trip: data.tripId,
      note: data.description,
    };
  },
  insertMany: async (docs) => {
    const inserts = docs.map(d => ({
      tripId: d.trip,
      day: d.day || 1,
      title: d.title,
      description: d.note || "",
      isAiSuggestion: d.isAiSuggestion || false,
      aiSource: d.aiSource || "",
    }));
    const { data, error } = await supabase.from("itineraries").insert(inserts).select();
    if (error) throw error;
    return (data || []).map(r => ({ ...r, _id: r.id, trip: r.tripId, note: r.description }));
  },
  findByIdAndUpdate: async (id, updateFields, options) => {
    const mapped = {};
    if (updateFields.day !== undefined) mapped.day = updateFields.day;
    if (updateFields.title !== undefined) mapped.title = updateFields.title;
    if (updateFields.note !== undefined) mapped.description = updateFields.note;
    
    const { data, error } = await supabase.from("itineraries").update(mapped).eq("id", id).select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id, trip: data.tripId, note: data.description } : null;
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("itineraries").delete().eq("id", id);
    return true;
  }
};

export default Itinerary;