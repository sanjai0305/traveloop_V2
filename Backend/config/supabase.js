/**
 * supabase.js
 *
 * Public (Anon Key) Supabase client for standard, RLS-governed operations.
 *
 * WHY: All regular database reads/writes that respect RLS policies go through
 * this client. It uses the Anon Key which is safe to deploy alongside
 * server-side code for non-privileged queries.
 *
 * For privileged operations (admin bootstrap, seeding), use supabaseAdmin.js.
 */

import "./env.js";
import { createClient } from "@supabase/supabase-js";

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
 * Standard Supabase Client — respects RLS policies.
 * Use for all regular authenticated or public database operations.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
