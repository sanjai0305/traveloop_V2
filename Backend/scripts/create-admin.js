import "../config/env.js";
import bcrypt from "bcryptjs";
import supabaseAdmin from "../config/supabaseAdmin.js";

async function createAdminScript() {
  console.log("=========================================");
  console.log("    Admin Account Creation Script");
  console.log("=========================================\n");

  const name = process.env.ADMIN_NAME || "Super Admin";
  const email = (process.env.ADMIN_EMAIL || "sanjaim0940r@gmail.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin@123";

  if (!email || !password) {
    console.error("❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    process.exit(1);
  }

  try {
    // Check if email already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from("admins")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking database:", checkError.message);
      process.exit(1);
    }

    if (existingAdmin) {
      console.log(`⚠️ Admin with email '${email}' already exists (ID: ${existingAdmin.id}). No duplicate created.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullPermissions = [
      "all",
      "manage_users",
      "manage_agents",
      "manage_trips",
      "manage_bookings",
      "manage_finance",
      "manage_settings",
      "super_admin"
    ];

    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from("admins")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: "super_admin",
          permissions: fullPermissions,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Failed to create admin:", insertError.message);
      process.exit(1);
    }

    console.log("✅ Admin created successfully!");
    console.log(`   - ID: ${newAdmin.id}`);
    console.log(`   - Name: ${newAdmin.name}`);
    console.log(`   - Email: ${newAdmin.email}`);
    console.log(`   - Role: ${newAdmin.role}`);
    console.log(`   - Password: [HASHED]`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    process.exit(1);
  }
}

createAdminScript();
