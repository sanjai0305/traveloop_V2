import { supabase } from "../config/supabase.js";

const SystemSetting = {
  findOne: async (query = {}) => {
    let q = supabase.from("system_settings").select("*");
    if (query.key) {
      q = q.eq("key", query.key);
    }
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
      save: async function() {
        const { id: _id, _id: __id, save: _save, ...fields } = this;
        await supabase.from("system_settings").update(fields).eq("id", _id);
      }
    };
  },
  // Support `new SystemSetting({ key, value })` pattern used in adminController
  create: async (payload) => {
    const { data, error } = await supabase
      .from("system_settings")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return { ...data, _id: data.id };
  }
};

// Support `new SystemSetting(payload)` syntax as a constructor-like factory
const SystemSettingProxy = new Proxy(SystemSetting, {
  construct(target, args) {
    const payload = args[0] || {};
    // Return a plain object with a save() that upserts
    return {
      ...payload,
      save: async function() {
        const { save: _save, ...fields } = this;
        const { error } = await supabase
          .from("system_settings")
          .upsert([fields], { onConflict: "key" });
        if (error) throw error;
      }
    };
  }
});

export default SystemSettingProxy;
