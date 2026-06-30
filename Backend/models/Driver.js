import { supabase } from "../config/supabase.js";

const Driver = {
  findOne: async (query) => {
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
