import "./env.js";
import supabase from "./supabase.js";

export const connectDB = async () => {
  try {
    console.log(
      "[Supabase Init] URL:",
      process.env.SUPABASE_URL || "Using fallback"
    );

    // Verify connectivity by reading master bus_types table
    const { error } = await supabase.from("bus_types").select("id").limit(1);
    if (error && error.code !== "PGRST116") {
      console.warn("[Supabase Connect Notice]", error.message);
    } else {
      console.log(`✅ Supabase PostgreSQL Connected`);
    }

    // Seed master data if tables are empty
    const seedIfEmpty = async (table, defaults) => {
      try {
        const { count, error: countErr } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true });

        if (!countErr && (count === 0 || count === null)) {
          const insertPayload = defaults.map((name) => ({ name }));
          await supabase.from(table).insert(insertPayload);
          console.log(`Seeded default values for Supabase table: ${table}`);
        }
      } catch (seedErr) {
        console.warn(`[Seed Warning] Failed to seed ${table}:`, seedErr.message);
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
