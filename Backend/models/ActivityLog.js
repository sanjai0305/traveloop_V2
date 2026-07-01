import { supabase } from "../config/supabase.js";

const ActivityLog = {
  create: async (payload) => {
    const mapped = {
      tripId: payload.trip,
      userId: payload.user,
      action: payload.action,
    };
    const { data, error } = await supabase.from("activity_logs").insert([mapped]).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, trip: data.tripId, user: data.userId };
  },
  find: async (query = {}) => {
    let q = supabase.from("activity_logs").select("*");
    if (query.trip) {
      q = q.eq("tripId", query.trip);
    }
    const { data, error } = await q.order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({ ...r, _id: r.id, trip: r.tripId, user: r.userId }));
  }
};

export default ActivityLog;
