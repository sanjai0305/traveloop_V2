/**
 * db.js
 *
 * Database connectivity + master data seeding.
 *
 * WHY supabaseAdmin for seeding: Master lookup tables (bus_types, hotel_amenities, etc.)
 * may have RLS enabled. The Service Role client bypasses RLS to safely insert seed data
 * on startup without needing a per-table RLS policy for the anonymous role.
 *
 * The regular `supabase` anon client is exported for use in routes/controllers
 * that perform RLS-governed end-user operations.
 */

import "./env.js";
import supabase from "./supabase.js";
import supabaseAdmin from "./supabaseAdmin.js";

export const connectDB = async () => {
  try {
    console.log(
      "[Supabase Init] URL:",
      process.env.SUPABASE_URL || "Using fallback"
    );

    // Verify connectivity using the anon client (tests public read access)
    const { error } = await supabase.from("bus_types").select("id").limit(1);
    if (error && error.code !== "PGRST116") {
      console.warn("[Supabase Connect Notice]", error.message);
    } else {
      console.log(`✅ Supabase PostgreSQL Connected`);
    }

    // Seed master data if tables are empty.
    // Uses supabaseAdmin to bypass RLS on lookup tables.
    const seedIfEmpty = async (table, defaults) => {
      try {
        const { count, error: countErr } = await supabaseAdmin
          .from(table)
          .select("id", { count: "exact", head: true });

        if (!countErr && (count === 0 || count === null)) {
          const insertPayload = defaults.map((name) => ({ name }));
          await supabaseAdmin.from(table).insert(insertPayload);
          console.log(`Seeded default values for Supabase table: ${table}`);
        }
      } catch (seedErr) {
        console.warn(
          `[Seed Warning] Failed to seed ${table}:`,
          seedErr.message
        );
      }
    };

    await seedIfEmpty("bus_types", [
      "AC Sleeper",
      "Semi Sleeper",
      "Volvo",
      "Mini Bus",
      "Tempo Traveller",
    ]);

    await seedIfEmpty("bus_amenities", [
      "WiFi",
      "Charging",
      "Blanket",
      "Water Bottle",
      "Recliner Seats",
      "TV",
      "Snacks",
      "USB Port",
      "Reading Light",
    ]);

    await seedIfEmpty("hotel_amenities", [
      "Swimming Pool",
      "WiFi",
      "Gym",
      "Breakfast",
      "Parking",
      "Spa",
      "Jacuzzi",
      "Kids Zone",
      "Conference Hall",
      "Private Beach",
      "Pool Bar",
    ]);

    await seedIfEmpty("trip_activities", [
      "Beach Visit",
      "Cruise",
      "Temple Visit",
      "Shopping",
      "Safari",
      "Campfire",
      "Adventure Sports",
      "Trekking",
      "Boating",
      "Museum",
      "Night Party",
      "Scuba Diving",
      "ATV Ride",
      "Zipline",
      "Kayaking",
    ]);

    return supabase;
  } catch (error) {
    console.error(`❌ Supabase Connection Error: ${error.message}`);
    // Non-fatal fallback for development
    return supabase;
  }
};

export default connectDB;
