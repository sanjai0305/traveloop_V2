import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";

const wrapAdmin = (data) => {
  if (!data) return null;
  return {
    ...data,
    _id: data.id,
    matchPassword: async function(enteredPassword) {
      const hashToCompare = this.passwordHash;
      if (!hashToCompare) return false;
      return await bcrypt.compare(enteredPassword, hashToCompare);
    },
    save: async function() {
      const { id: _id, _id: __id, matchPassword: _match, save: _save, ...fields } = this;
      
      // Handle password hashing if plain password is set on the object
      if (fields.password) {
        const salt = await bcrypt.genSalt(10);
        fields.passwordHash = await bcrypt.hash(fields.password, salt);
        delete fields.password;
        this.passwordHash = fields.passwordHash;
        delete this.password;
      }

      await supabase.from("admins").update(fields).eq("id", _id || id);
    }
  };
};

const Admin = {
  findOne: async (query = {}) => {
    let q = supabase.from("admins").select("*");
    if (query.email) {
      q = q.eq("email", query.email.toLowerCase());
    }
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return wrapAdmin(data);
  },

  findById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase.from("admins").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return wrapAdmin(data);
  },

  create: async (payload) => {
    const fields = { ...payload };
    
    // Hash password before inserting
    if (fields.password) {
      const salt = await bcrypt.genSalt(10);
      fields.passwordHash = await bcrypt.hash(fields.password, salt);
      delete fields.password;
    }

    const { data, error } = await supabase.from("admins").insert([fields]).select().single();
    if (error) throw error;
    return wrapAdmin(data);
  }
};

export default Admin;
