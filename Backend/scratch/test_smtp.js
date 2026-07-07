import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { sendDriverOtpEmail } from "../services/emailService.js";

async function run() {
  try {
    console.log("Calling sendDriverOtpEmail directly for driver verification email test...");
    await sendDriverOtpEmail("sanjaim2006r@gmail.com", "583912");
    console.log("✅ sendDriverOtpEmail test complete");
  } catch (err) {
    console.error("❌ sendDriverOtpEmail test failed:", err.message);
    console.error(err);
  }
}

run();
