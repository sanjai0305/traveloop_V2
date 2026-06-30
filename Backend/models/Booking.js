import { supabase } from "../config/supabase.js";

const Booking = {
  find: async (query = {}) => {
    let q = supabase.from("bookings").select("*");
    if (query.userId) {
      q = q.eq("userId", query.userId);
    }
    if (query.tripId) {
      q = q.eq("tripId", query.tripId);
    }
    if (query.agentTrip) {
      q = q.eq("tripId", query.agentTrip);
    }
    const { data } = await q;
    return (data || []).map(r => ({ ...r, _id: r.id, agentTrip: r.tripId }));
  },
  findOne: async (query = {}) => {
    let q = supabase.from("bookings").select("*");
    if (query.bookingId) {
      q = q.eq("bookingId", query.bookingId);
    }
    if (query._id) {
      q = q.eq("id", query._id);
    }
    const { data } = await q.maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      agentTrip: data.tripId,
      save: async function() {
        const { id, _id, agentTrip, ...fields } = this;
        delete fields.save;
        await supabase.from("bookings").update(fields).eq("id", id);
      }
    };
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      agentTrip: data.tripId,
      save: async function() {
        const { id, _id, agentTrip, ...fields } = this;
        delete fields.save;
        await supabase.from("bookings").update(fields).eq("id", id);
      }
    };
  },
  create: async (payload) => {
    const mapped = { ...payload };
    if (mapped.agentTrip) {
      mapped.tripId = mapped.agentTrip;
      delete mapped.agentTrip;
    }
    const { data, error } = await supabase.from("bookings").insert([mapped]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      agentTrip: data.tripId,
      save: async function() {
        const { id, _id, agentTrip, ...fields } = this;
        delete fields.save;
        await supabase.from("bookings").update(fields).eq("id", id);
      }
    };
  }
};

export default Booking;
