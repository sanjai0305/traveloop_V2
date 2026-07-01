import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const AdminNotification = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("admin_notifications").select("*");
      if (query.read !== undefined) {
        q = q.eq("read", query.read);
      }
      if (query.type) {
        q = q.eq("type", query.type);
      }
      const { data, error } = await q.order("createdAt", { ascending: false });
      if (error) throw error;
      return (data || []).map(r => ({ ...r, _id: r.id }));
    })();
    return makeQueryChain(promise);
  },
  findById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id: _id, _id: __id, save: _save, ...fields } = this;
        await supabase.from("admin_notifications").update(fields).eq("id", _id || id);
      }
    };
  },
  create: async (payload) => {
    const isArray = Array.isArray(payload);
    const payloads = isArray ? payload : [payload];
    
    const mapped = payloads.map(p => ({
      title: p.title,
      message: p.message,
      type: p.type || "info",
      read: p.read || false,
    }));

    const { data, error } = await supabase
      .from("admin_notifications")
      .insert(mapped)
      .select();

    if (error) throw error;
    if (isArray) {
      return (data || []).map(r => ({ ...r, _id: r.id }));
    }
    return data && data.length > 0 ? { ...data[0], _id: data[0].id } : null;
  },
  updateMany: async (filter, updateFields) => {
    let q = supabase.from("admin_notifications").update(updateFields);
    if (filter.read !== undefined) {
      q = q.eq("read", filter.read);
    }
    const { error } = await q;
    if (error) throw error;
    return { modifiedCount: 1 };
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("admin_notifications").delete();
    if (filter.read !== undefined) {
      q = q.eq("read", filter.read);
    } else {
      q = q.not("id", "is", "null");
    }
    const { error } = await q;
    if (error) throw error;
    return { deletedCount: 1 };
  }
};

export default AdminNotification;
