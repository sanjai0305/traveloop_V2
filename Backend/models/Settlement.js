import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const Settlement = {
  findById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase
      .from("settlements")
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
        await supabase.from("settlements").update(fields).eq("id", _id || id);
      }
    };
  },
  create: async (payload) => {
    const { data, error } = await supabase
      .from("settlements")
      .insert([payload])
      .select().single();
    if (error) throw error;
    return { ...data, _id: data.id };
  },
  findOne: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("settlements").select("*");
      if (query.bookingId) {
        q = q.eq("bookingId", query.bookingId);
      }
      if (query.agentId) {
        q = q.eq("agentId", query.agentId);
      }
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        _id: data.id,
        save: async function() {
          const { id: _id, _id: __id, save: _save, ...fields } = this;
          await supabase.from("settlements").update(fields).eq("id", _id);
        }
      };
    })();
    return makeQueryChain(promise);
  }
};

export default Settlement;
