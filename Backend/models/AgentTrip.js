import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const AgentTrip = {
  find: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("agent_trips").select("*");
      if (query.driver) {
        q = q.eq("driverId", query.driver);
      }
      if (query.status) {
        q = q.eq("status", query.status);
      }
      const { data } = await q;
      return (data || []).map(r => ({ ...r, _id: r.id }));
    })();
    return makeQueryChain(promise);
  },
  findOne: (query = {}) => {
    const promise = (async () => {
      let q = supabase.from("agent_trips").select("*");
      if (query._id) {
        q = q.eq("id", query._id);
      }
      if (query.startDate) {
        q = q.eq("startDate", query.startDate);
      }
      const { data } = await q.maybeSingle();
      if (!data) return null;
      return {
        ...data,
        _id: data.id,
        save: async function() {
          const { id, _id, ...fields } = this;
          delete fields.save;
          await supabase.from("agent_trips").update(fields).eq("id", id);
        }
      };
    })();
    return makeQueryChain(promise);
  },
  findById: async (id) => {
    if (!id) return null;
    const { data } = await supabase.from("agent_trips").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("agent_trips").update(fields).eq("id", id);
      }
    };
  },
  create: async (payload) => {
    const { data, error } = await supabase.from("agent_trips").insert([payload]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id, _id, ...fields } = this;
        delete fields.save;
        await supabase.from("agent_trips").update(fields).eq("id", id);
      }
    };
  },
  findByIdAndUpdate: async (id, updateFields, options) => {
    const { data, error } = await supabase.from("agent_trips").update(updateFields).eq("id", id).select().single();
    if (error) throw error;
    return data ? { ...data, _id: data.id } : null;
  },
  findByIdAndDelete: async (id) => {
    await supabase.from("agent_trips").delete().eq("id", id);
    return true;
  }
};

export default AgentTrip;
