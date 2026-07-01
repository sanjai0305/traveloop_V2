import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const wrapFlight = (data) => {
  if (!data) return null;
  return {
    ...data,
    _id: data.id,
    trip: data.tripId,
    save: async function() {
      const { id, _id, trip, save: _save, ...fields } = this;
      fields.tripId = this.tripId || (trip && (trip.id || trip)) || undefined;
      const { error } = await supabase.from("flights").update(fields).eq("id", id);
      if (error) throw error;
    }
  };
};

const Flight = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("flights").select("*");
      if (query.trip) {
        q = q.eq("tripId", query.trip);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => wrapFlight(r));
    })();
    return makeQueryChain(promise);
  },
  findById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase.from("flights").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return wrapFlight(data);
  },
  create: async (payload) => {
    const mapped = {
      tripId: payload.trip,
      flightNumber: payload.flightNumber,
      airline: payload.airline,
      departureAirport: payload.departureAirport || "",
      arrivalAirport: payload.arrivalAirport || "",
      departureTime: payload.departureTime || null,
      arrivalTime: payload.arrivalTime || null,
      terminal: payload.terminal || "",
      gate: payload.gate || "",
      status: payload.status || "scheduled",
      delayMinutes: payload.delayMinutes || 0,
    };
    const { data, error } = await supabase.from("flights").insert([mapped]).select().single();
    if (error) throw error;
    return wrapFlight(data);
  },
  findByIdAndUpdate: async (id, updateFields, options) => {
    const fields = { ...updateFields };
    if (fields.trip) {
      fields.tripId = fields.trip;
      delete fields.trip;
    }
    const { data, error } = await supabase.from("flights").update(fields).eq("id", id).select().single();
    if (error) throw error;
    return wrapFlight(data);
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("flights").delete().eq("id", id);
    return true;
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("flights").delete();
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

export default Flight;
