import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { sendOtpEmail } from "../services/emailService.js";

async function run() {
  try {
    console.log("Calling sendOtpEmail directly for driver verification email test...");
    await sendOtpEmail("sanjaim2006r@gmail.com", "583912", "SANJAI");
    console.log("✅ sendOtpEmail test complete");
  } catch (err) {
    console.error("❌ sendOtpEmail test failed:", err.message);
    console.error(err);
  }
}

run();
