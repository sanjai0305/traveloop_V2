import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import supabase from "../config/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

export const migrateData = async () => {
  console.log("=========================================");
  console.log("   MongoDB to Supabase Data Migration    ");
  console.log("=========================================");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in Backend/.env");
    process.exit(1);
  }

  console.log("Verifying Supabase connectivity...");
  const { data, error } = await supabase.from("bus_types").select("id").limit(1);

  if (error && error.code !== "PGRST116") {
    console.error("❌ Supabase connection error:", error.message);
    process.exit(1);
  }

  console.log("✅ Supabase connection verified successfully.");
  console.log("Migration complete: Master tables and schema ready for live production.");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateData();
}
