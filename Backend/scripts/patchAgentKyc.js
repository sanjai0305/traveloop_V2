/**
 * patchAgentKyc.js
 *
 * Patches the agent sanjaim0940r@gmail.com to KYC_COMPLETED status so trips can be created.
 *
 * Run from Backend/ directory:
 *   node scripts/patchAgentKyc.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Agent from "../models/Agent.js";

const MONGO_URI   = process.env.MONGO_URI || "mongodb://localhost:27017/traveloop";
const AGENT_EMAIL = "sanjaim0940r@gmail.com";

await mongoose.connect(MONGO_URI);
console.log("✅ MongoDB Connected:", mongoose.connection.host);

const agent = await Agent.findOne({ email: AGENT_EMAIL });
if (!agent) {
  console.log("❌ Agent not found:", AGENT_EMAIL);
  process.exit(1);
}

console.log("Before patch:");
console.log("  kycStatus      :", agent.kycStatus);
console.log("  emailVerified  :", agent.emailVerified);
console.log("  mobileVerified :", agent.mobileVerified);
console.log("  mobile         :", agent.mobile);
console.log("  dob            :", agent.dob);

// Apply patch
agent.kycStatus       = "KYC_COMPLETED";
agent.emailVerified   = true;
agent.mobileVerified  = true;
agent.profileCompleted = true;
agent.mobile          = agent.mobile || "9876543210";
agent.dob             = agent.dob    || "1990-01-01";
agent.gstNo           = agent.gstNo  || agent.gstNumber || "33AABCU9603R1ZV";
agent.state           = agent.state  || "Tamil Nadu";
agent.country         = agent.country || "India";

await agent.save();

console.log("\nAfter patch:");
console.log("  kycStatus      :", agent.kycStatus);
console.log("  emailVerified  :", agent.emailVerified);
console.log("  mobileVerified :", agent.mobileVerified);

console.log("\n✅ Agent KYC patched to KYC_COMPLETED.");
await mongoose.disconnect();
process.exit(0);
