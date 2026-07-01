import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const Notification = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("notifications").select("*");
      if (query.user) {
        q = q.eq("userId", query.user);
      }
      if (query.trip) {
        q = q.eq("tripId", query.trip);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => ({ ...r, _id: r.id, user: r.userId, trip: r.tripId }));
    })();
    return makeQueryChain(promise);
  },
  findOne: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("notifications").select("*");
      if (query.user) {
        q = q.eq("userId", query.user);
      }
      if (query.trip) {
        q = q.eq("tripId", query.trip);
      }
      if (query.type) {
        q = q.eq("type", query.type);
      }
      if (query.read !== undefined) {
        q = q.eq("read", query.read);
      }
      if (query.createdAt && query.createdAt.$gte) {
        const gteVal = query.createdAt.$gte.toISOString ? query.createdAt.$gte.toISOString() : query.createdAt.$gte;
        q = q.gte("createdAt", gteVal);
      }
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, _id: data.id, user: data.userId, trip: data.tripId };
    })();
    return makeQueryChain(promise);
  },
  findById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase.from("notifications").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      user: data.userId,
      trip: data.tripId,
      save: async function() {
        const { id: _id, _id: __id, user, trip, save: _save, ...fields } = this;
        fields.userId = this.userId || (user && (user.id || user)) || undefined;
        fields.tripId = this.tripId || (trip && (trip.id || trip)) || undefined;
        if (this.inviteStatus !== undefined) fields.inviteStatus = this.inviteStatus;
        if (this.read !== undefined) fields.read = this.read;
        await supabase.from("notifications").update(fields).eq("id", _id || id);
      }
    };
  },
  create: async (payload) => {
    const mapped = {
      userId: payload.user,
      title: payload.title,
      message: payload.message,
      type: payload.type || "info",
      tripId: payload.trip || null,
      isInvite: payload.isInvite || false,
      inviteStatus: payload.inviteStatus || null,
      read: payload.read || false,
    };
    const { data, error } = await supabase.from("notifications").insert([mapped]).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, user: data.userId, trip: data.tripId };
  },
  findOneAndUpdate: async (filter, updateFields, options) => {
    let q = supabase.from("notifications").update(updateFields);
    if (filter._id) {
      q = q.eq("id", filter._id);
    }
    if (filter.user) {
      q = q.eq("userId", filter.user);
    }
    const { data, error } = await q.select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id, user: data.userId, trip: data.tripId } : null;
  },
  findOneAndDelete: async (filter) => {
    let q = supabase.from("notifications").delete();
    if (filter._id) {
      q = q.eq("id", filter._id);
    }
    if (filter.user) {
      q = q.eq("userId", filter.user);
    }
    const { data, error } = await q.select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id, user: data.userId, trip: data.tripId } : null;
  },
  updateMany: async (filter, updateFields) => {
    let q = supabase.from("notifications").update(updateFields);
    if (filter.user) {
      q = q.eq("userId", filter.user);
    }
    if (filter.read !== undefined) {
      q = q.eq("read", filter.read);
    }
    const { error } = await q;
    if (error) throw error;
    return { modifiedCount: 1 };
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("notifications").delete();
    if (filter.$or) {
      const tripCond = filter.$or.find(c => c.trip);
      const msgCond = filter.$or.find(c => c.message);
      let orClause = "";
      if (tripCond) {
        orClause += `tripId.eq.${tripCond.trip}`;
      }
      if (msgCond) {
        if (orClause) orClause += ",";
        const pattern = msgCond.message.$regex || msgCond.message;
        orClause += `message.ilike.%${pattern}%`;
      }
      if (orClause) {
        q = q.or(orClause);
      }
    } else if (filter.user) {
      if (filter.user.$in) {
        q = q.in("userId", filter.user.$in);
      } else {
        q = q.eq("userId", filter.user);
      }
    } else if (filter.trip) {
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

export default Notification;
