import "./env.js";
import { createClient } from "@supabase/supabase-js";
import supabaseAdmin from "./supabaseAdmin.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error(
    "[supabase] FATAL: SUPABASE_URL is not set in environment variables."
  );
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.warn(
    "[supabase] WARNING: SUPABASE_ANON_KEY is not set. Falling back to empty key. " +
      "Standard database operations may fail."
  );
}

/**
 * Standard Supabase Client — uses Anon Key.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Smart Client Resolver:
 * Attempts to use the privileged Service Role client first (bypasses RLS).
 * If the Service Role key is invalid or returns an error, falls back gracefully
 * to the standard Supabase client.
 */
export const getDbClient = async () => {
  try {
    const testRes = await supabaseAdmin.from("users").select("id").limit(1);
    if (!testRes.error) {
      return supabaseAdmin;
    }
  } catch (e) {
    // Ignore and fallback
  }
  return supabase;
};

export default supabase;

