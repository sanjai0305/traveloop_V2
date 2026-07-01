import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const Driver = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("drivers").select("*");
      if (query.status) {
        q = q.eq("status", query.status);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        _id: r.id,
        save: async function() {
          const { id: _id, _id: __id, save: _save, ...fields } = this;
          await supabase.from("drivers").update(fields).eq("id", _id);
        }
      }));
    })();
    return makeQueryChain(promise);
  },

  findOne: (query) => {
    const promise = (async () => {
      let q = supabase.from("drivers").select("*");
      if (query.email) {
        q = q.eq("email", query.email);
      }
      const { data } = await q.maybeSingle();
      if (!data) return null;
      return {
        ...data,
        _id: data.id,
        save: async function() {
          const { id, _id, ...fields } = this;
          delete fields.save;
          await supabase.from("drivers").update(fields).eq("id", id);
        }
      };
    })();
    return makeQueryChain(promise);
  },

  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("drivers").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("drivers").update(fields).eq("id", id);
      }
    };
  },

  create: async (payload) => {
    const { data, error } = await supabase.from("drivers").insert([payload]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("drivers").update(fields).eq("id", id);
      }
    };
  }
};

export default Driver;
