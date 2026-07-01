import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const User = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("users").select("*");
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        _id: r.id,
        save: async function() {
          const { id: _id, _id: __id, save: _save, ...fields } = this;
          await supabase.from("users").update(fields).eq("id", _id);
        }
      }));
    })();
    return makeQueryChain(promise);
  },

  findOne: (query) => {
    const promise = (async () => {
      let q = supabase.from("users").select("*");
      if (query.email) {
        q = q.eq("email", query.email);
      }
      if (query.googleId) {
        q = q.eq("googleId", query.googleId);
      }
      if (query.firebaseUid) {
        q = q.eq("firebaseUid", query.firebaseUid);
      }
      const { data } = await q.maybeSingle();
      if (!data) return null;
      return {
        ...data,
        _id: data.id,
        save: async function() {
          const { id, _id, ...fields } = this;
          delete fields.save;
          await supabase.from("users").update(fields).eq("id", id);
        }
      };
    })();
    return makeQueryChain(promise);
  },

  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("users").update(fields).eq("id", id);
      }
    };
  },

  create: async (payload) => {
    const { data, error } = await supabase.from("users").insert([payload]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("users").update(fields).eq("id", id);
      }
    };
  },
  deleteMany: async (filter = {}) => {
    let q = supabase.from("users").delete();
    if (filter.email) {
      if (filter.email.$in) {
        q = q.in("email", filter.email.$in);
      } else {
        q = q.eq("email", filter.email);
      }
    } else {
      q = q.not("id", "is", "null");
    }
    const { error } = await q;
    if (error) throw error;
    return { deletedCount: 1 };
  },
  deleteOne: async (filter = {}) => {
    let q = supabase.from("users").delete();
    if (filter._id) {
      q = q.eq("id", filter._id);
    } else if (filter.email) {
      q = q.eq("email", filter.email);
    } else {
      q = q.not("id", "is", "null");
    }
    const { error } = await q;
    if (error) throw error;
    return { deletedCount: 1 };
  }
};

export default User;