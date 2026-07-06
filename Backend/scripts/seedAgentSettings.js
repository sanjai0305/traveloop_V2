/**
 * seedAgentSettings.js
 * Seeds the default agent settings singleton document into MongoDB.
 * Run from Backend/ directory:
 *   node scripts/seedAgentSettings.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import AgentSettings from "../models/AgentSettings.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/traveloop";

await mongoose.connect(MONGO_URI);
console.log("✅ MongoDB Connected:", mongoose.connection.host);

// Delete existing settings first to ensure fresh seed
await AgentSettings.deleteMany({ settingId: "global" });

const defaultSettings = await AgentSettings.create({
  settingId: "global",
  defaultTripSlots: 2,
  extraSlotsPerReferral: 1,
  maxSlots: 5,
  approvalTimeLimit: 1, // 1 hour
  referralEnabled: true,
  referralDiscountPercent: 5,
  inviterCoins: 100,
  scratchRewardsEnabled: true,
  minRewardPercent: 5,
  maxRewardPercent: 30,
  tripSlotBonusEnabled: true,
  slotPrice: 1000,
  slotPurchaseEnabled: true
});

console.log("✅ AgentSettings initialized successfully:", defaultSettings);

await mongoose.disconnect();
process.exit(0);
