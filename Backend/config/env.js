import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const emailFrom = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

console.log("==========================================");
console.log("ENV CONFIGURATION STATUS");
console.log("==========================================\n");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`PORT: ${process.env.PORT || "5000"}`);
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`EMAIL_FROM: ${emailFrom ? "✅ LOADED" : "❌ MISSING"}\n`);
console.log("==========================================\n");
