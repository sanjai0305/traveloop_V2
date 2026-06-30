import "./config/env.js";
import { supabase } from "./config/supabase.js";
import protect from "./middleware/authMiddleware.js";

async function verifyImports() {
  console.log("=== SUPABASE MIGRATION IMPORTS & WRAPPER CHECK ===");
  try {
    if (!supabase) {
      throw new Error("Supabase client is not initialized.");
    }
    console.log("✅ Supabase Client loaded successfully.");
    console.log("✅ Auth Middleware wrapper compiled successfully.");

    console.log("\nAll imports and middleware configs verify cleanly!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  }
}

verifyImports();
