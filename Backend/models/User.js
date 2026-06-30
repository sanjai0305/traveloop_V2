import { supabase } from "../config/supabase.js";

const User = {
  findOne: async (query) => {
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
        // Strip functions
        delete fields.save;
        await supabase.from("users").update(fields).eq("id", id);
      }
    };
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
  }
};

export default User;