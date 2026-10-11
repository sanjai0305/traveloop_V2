import bcrypt from "bcryptjs";
import crypto from "crypto";
import db from "../config/db.js";
import { envPath } from "../config/env.js";

/**
 * Bootstrap Super Admin account if no admins exist in the MySQL database.
 */
export const bootstrapAdmin = async () => {
  const adminName = process.env.ADMIN_NAME || "Super Admin";
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminEmail || !adminPassword) {
    console.warn(
      "⚠️ [Admin Bootstrap] Skipping bootstrap: ADMIN_EMAIL or ADMIN_PASSWORD missing from environment."
    );
    return;
  }

  try {
    const rows = await db.query("SELECT COUNT(*) AS cnt FROM `admins`");
    const count = rows && rows[0]?.cnt ? Number(rows[0].cnt) : 0;

    if (count > 0) {
      console.log("✅ Super Admin already exists in MySQL. Skipping bootstrap.");
      return;
    }

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

    const adminId = crypto.randomUUID();
    await db.query(
      "INSERT INTO `admins` (id, name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?, ?)",
      [
        adminId,
        adminName,
        adminEmail,
        hashedPassword,
        "ADMIN",
        JSON.stringify(fullPermissions),
      ]
    );

    console.log("==================================================");
    console.log(`🎉 SUPER ADMIN BOOTSTRAP COMPLETE! (MySQL)`);
    console.log(`  - ID:          ${adminId}`);
    console.log(`  - Name:        ${adminName}`);
    console.log(`  - Email:       ${adminEmail}`);
    console.log("==================================================");
  } catch (error) {
    console.warn("[Admin Bootstrap Notice] Could not bootstrap admin (MySQL table may not be initialized yet):", error.message);
  }
};

export default bootstrapAdmin;
