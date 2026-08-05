/**
 * supabaseAdmin.js
 *
 * Service Role Supabase client for privileged server-side operations.
 *
 * WHY: The Service Role key (or Secret key) bypasses Row Level Security (RLS),
 * allowing trusted backend operations such as admin bootstrap, master seeding,
 * and background operations to succeed regardless of client-side RLS policies.
 *
 * SECURITY: This file must NEVER be imported by any frontend code.
 * It is strictly for server-side Node.js use only.
 */

import "./env.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error(
    "[supabaseAdmin] FATAL: SUPABASE_URL is not set in environment variables."
  );
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "[supabaseAdmin] FATAL: SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. " +
      "This key is required for privileged backend operations (admin bootstrap, seeding). " +
      "Set it in your .env file and ensure it is never exposed to the frontend."
  );
  process.exit(1);
}

// Key Format Validation (Supabase v2 / API Key Spec):
// - Publishable / Anon keys start with `sb_publishable_` -> MUST be rejected for Admin client
// - Secret / Service Role keys start with `sb_secret_` (new format) OR `eyJ...` (legacy JWT) -> VALID
if (serviceRoleKey.startsWith("sb_publishable_")) {
  console.error(
    "[supabaseAdmin] FATAL: SUPABASE_SERVICE_ROLE_KEY appears to be a Publishable/Anon key (starts with 'sb_publishable_').\n" +
      "  The Service Role client requires a Secret key to bypass Row Level Security (RLS).\n" +
      "  Find your Secret key at: Supabase Dashboard -> Project Settings -> API -> secret / service_role key.\n" +
      "  Copy the Secret key and set it in your .env as SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

let keyFormat = "Standard Key";
if (serviceRoleKey.startsWith("sb_secret_")) {
  keyFormat = "Secret Key (sb_secret_...)";
} else if (serviceRoleKey.startsWith("eyJ")) {
  keyFormat = "Legacy JWT (eyJ...)";
}

console.log(
  `[supabaseAdmin] Initializing Service Role client [Key Format: ${keyFormat}]`
);

/**
 * Supabase Admin Client — bypasses RLS.
 * Use ONLY for trusted server-side operations.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabaseAdmin;
