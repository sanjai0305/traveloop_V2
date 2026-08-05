import bcrypt from "bcryptjs";
import supabaseAdmin from "../config/supabaseAdmin.js";
import { envPath } from "../config/env.js";

/**
 * Bootstrap Super Admin account if no admins exist in database.
 *
 * WHY supabaseAdmin: The `admins` table has RLS enabled. The Service Role
 * client bypasses RLS, so this privileged startup operation succeeds even
 * before any RLS policies are configured for admin rows.
 */
export const bootstrapAdmin = async () => {
  const adminName = process.env.ADMIN_NAME || "Super Admin";
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  // Debug logging as requested
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
    // Check how many admins exist (Service Role bypasses RLS)
    const { count, error: countError } = await supabaseAdmin
      .from("admins")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(
        "❌ [Admin Bootstrap] Error checking admins table:",
        countError.message
      );
      return;
    }

    if (count === 0) {
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

      const { data: createdAdmin, error: insertError } = await supabaseAdmin
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
        .single();

      if (insertError) {
        console.error(
          "❌ [Admin Bootstrap] Failed to create Super Admin:",
          insertError.message
        );
      } else {
        console.log(
          `✅ [Admin Bootstrap] Super Admin created successfully: ${createdAdmin.email} (Role: ${createdAdmin.role})`
        );
      }
    } else {
      console.log(
        `ℹ️ [Admin Bootstrap] Admins exist in database (${count} found). Bootstrap skipped.`
      );
    }
  } catch (err) {
    console.error(
      "❌ [Admin Bootstrap] Unexpected error during bootstrap:",
      err.message
    );
  }
};

export default bootstrapAdmin;
