import "./env.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://kqvgztjrwsughjquzcrs.supabase.co";

// Use valid working key (prefer ANON key if SERVICE_ROLE_KEY is sb_secret format that PostgREST rejects)
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey || supabaseKey.startsWith("sb_secret_")) {
  supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_qbwCN80NJZasYdW3wHqV_A_OQaog5MC";
}

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[Supabase Warning] SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables."
  );
}

// Administrative Supabase Client
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabase;

