import { supabase } from "../config/supabase.js";
import { makeQueryChain } from "./queryHelper.js";

const Commission = {
  create: async (payload) => {
    const mapped = {
      defaultRate: payload.defaultRate ?? 10,
      updatedBy: payload.updatedBy ?? null,
    };
    const { data, error } = await supabase
      .from("commissions")
      .insert([mapped])
      .select()
      .single();
    if (error) throw error;
    return { ...data, _id: data.id };
  },
  findOne: (query = {}) => {
    const promise = (async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, _id: data.id };
    })();
    return makeQueryChain(promise);
  }
};

export default Commission;
