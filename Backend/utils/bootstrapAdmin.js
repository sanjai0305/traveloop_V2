import bcrypt from "bcryptjs";
import supabaseAdmin from "../config/supabaseAdmin.js";
import supabase from "../config/supabase.js";
import { envPath } from "../config/env.js";

/**
 * Helper to log detailed error objects following production standards.
 */
const logError = (contextMessage, error) => {
  console.error(`❌ [Admin Bootstrap] ${contextMessage}`);
  if (error) {
    console.error(`  - error.message: ${error.message || error.msg || "N/A"}`);
    console.error(`  - error.code:    ${error.code || "N/A"}`);
    console.error(`  - error.details: ${error.details || "N/A"}`);
    console.error(`  - error.hint:    ${error.hint || "N/A"}`);
    console.error(`  - Full error object:`, error);
  }
};

/**
 * Bootstrap Super Admin account if no admins exist in database.
 *
 * WHY supabaseAdmin: The `admins` table has RLS enabled. The Service Role
 * client bypasses RLS. If the service key is invalid or fails, we fall back
 * to the standard client.
 */
export const bootstrapAdmin = async () => {
  const adminName = process.env.ADMIN_NAME || "Super Admin";
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  // Debug logging
  console.log("[Admin Bootstrap Debug] Loaded .env Path:", envPath);
  console.log("[Admin Bootstrap Debug] ADMIN_NAME:", adminName);
  console.log("[Admin Bootstrap Debug] ADMIN_EMAIL:", adminEmail || "(NOT LOADED)");
  console.log(
    "[Admin Bootstrap Debug] ADMIN_PASSWORD Loaded:",
    Boolean(adminPassword)
  );

  if (!adminEmail || !adminPassword) {
    console.warn(
      "⚠️ [Admin Bootstrap] Skipping bootstrap: ADMIN_EMAIL or ADMIN_PASSWORD missing from environment."
    );
    return;
  }

  try {
    // 1. Primary check using supabaseAdmin (HTTP GET without head: true)
    let client = supabaseAdmin;
    let { data, count, error: checkError } = await client
      .from("admins")
      .select("*", { count: "exact" });

    // 2. If Service Role key fails (e.g. 401 Unregistered API key), fallback to standard Supabase client
    if (checkError) {
      logError("Service Role client failed to check admins table. Attempting fallback to standard Supabase client.", checkError);
      client = supabase;
      const fallbackRes = await client
        .from("admins")
        .select("*", { count: "exact" });

      data = fallbackRes.data;
      count = fallbackRes.count;
      checkError = fallbackRes.error;
    }

    if (checkError) {
      logError("Error checking admins table:", checkError);
      return;
    }

    // 3. Determine if any Super Admin or admin record already exists
    const hasExistingAdmin =
      (typeof count === "number" && count > 0) ||
      (Array.isArray(data) && data.length > 0);

    if (hasExistingAdmin) {
      console.log("✅ Super Admin already exists. Skipping bootstrap.");
      return;
    }

    // 4. If table is empty, create the initial Super Admin
    console.log(
      "ℹ️ [Admin Bootstrap] Admins table is empty. Creating initial Super Admin..."
    );

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const fullPermissions = [
      "all",
      "manage_users",
      "manage_agents",
      "manage_trips",
      "manage_bookings",
      "manage_finance",
      "manage_settings",
      "super_admin",
    ];

    let { data: createdAdmin, error: insertError } = await client
      .from("admins")
      .insert([
        {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "super_admin",
          permissions: fullPermissions,
        },
      ])
      .select()
      .maybeSingle();

    // Retry insertion with fallback client if primary insert failed with service key error
    if (insertError && client !== supabase) {
      logError("Service Role client failed on admin creation. Retrying insertion with standard client.", insertError);
      client = supabase;
      const retryInsert = await client
        .from("admins")
        .insert([
          {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: "super_admin",
            permissions: fullPermissions,
          },
        ])
        .select()
        .maybeSingle();

      createdAdmin = retryInsert.data;
      insertError = retryInsert.error;
    }

    if (insertError) {
      logError("Failed to create Super Admin:", insertError);
    } else if (createdAdmin) {
      console.log(
        `✅ [Admin Bootstrap] Super Admin created successfully: ${createdAdmin.email} (Role: ${createdAdmin.role})`
      );
    }
  } catch (err) {
    logError("Unexpected error during bootstrap:", err);
  }
};

export default bootstrapAdmin;

