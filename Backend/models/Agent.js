import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const Agent = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("agents").select("*");
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
          await supabase.from("agents").update(fields).eq("id", _id);
        }
      }));
    })();
    return makeQueryChain(promise);
  },

  findOne: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("agents").select("*");
      if (query.email) {
        q = q.eq("email", query.email);
      } else if (query.uid) {
        q = q.eq("uid", query.uid);
      } else if (query.$or) {
        const emailQuery = query.$or.find(item => item.email);
        const uidQuery = query.$or.find(item => item.uid);
        if (emailQuery && uidQuery) {
          q = q.or(`email.eq.${emailQuery.email},uid.eq.${uidQuery.uid}`);
        } else if (emailQuery) {
          q = q.eq("email", emailQuery.email);
        } else if (uidQuery) {
          q = q.eq("uid", uidQuery.uid);
        }
      }
      const { data } = await q.maybeSingle();
      if (!data) return null;
      return {
        ...data,
        _id: data.id,
        save: async function() {
          const { id, _id, ...fields } = this;
          delete fields.save;
          await supabase.from("agents").update(fields).eq("id", id);
        }
      };
    })();
    return makeQueryChain(promise);
  },

  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("agents").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("agents").update(fields).eq("id", id);
      }
    };
  },

  create: async (payload) => {
    const { data, error } = await supabase.from("agents").insert([payload]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("agents").update(fields).eq("id", id);
      }
    };
  },

  findByIdAndUpdate: async (id, updateFields, options) => {
    const { data, error } = await supabase.from("agents").update(updateFields).eq("id", id).select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id } : null;
  }
};

export default Agent;
