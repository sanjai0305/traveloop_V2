import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const Booking = {
  find: (query = {}) => {
    const promise = (async () => {
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
    })();
    return makeQueryChain(promise);
  },
  findOne: (query = {}) => {
    const promise = (async () => {
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
    })();
    return makeQueryChain(promise);
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
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("bookings").delete();
    if (filter.agentTrip) {
      if (filter.agentTrip.$in) {
        q = q.in("tripId", filter.agentTrip.$in);
      } else {
        q = q.eq("tripId", filter.agentTrip);
      }
    } else {
      q = q.not("id", "is", "null");
    }
    const { error } = await q;
    if (error) throw error;
    return { deletedCount: 1 };
  }
};

export default Booking;
