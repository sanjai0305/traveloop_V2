import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const emailFrom = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
const gmailClientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
const gmailRedirectUri = process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground";

console.log("==========================================");
console.log("ENV CONFIGURATION STATUS:");
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- MONGO_URI: ${process.env.MONGO_URI ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`- EMAIL_FROM: ${emailFrom ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`- GMAIL_CLIENT_ID: ${gmailClientId ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`- GMAIL_CLIENT_SECRET: ${gmailClientSecret ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`- GMAIL_REFRESH_TOKEN: ${gmailRefreshToken ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`- GMAIL_REDIRECT_URI: ${gmailRedirectUri ? "✅ LOADED" : "❌ MISSING"}`);
console.log("==========================================");
