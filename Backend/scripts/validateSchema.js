/**
 * validateSchema.js — Traveloop Schema Purity Validator
 *
 * Scans each MongoDB collection for documents that still contain
 * deprecated alias fields after migration. Reports counts and sample IDs.
 *
 * Run after migrateIds.js:
 *   node Backend/scripts/validateSchema.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("❌  MONGO_URI not set in environment. Aborting.");
  process.exit(1);
}

const CHECKS = [
  // [collection, deprecated field, canonical field]
  ["bookings",    "agentTrip",  "tripId"],
  ["bookings",    "agent",      "agentId"],
  ["bookings",    "createdBy",  "userId"],
  ["bookings",    "bookingDate", null],         // should not exist; use createdAt
  ["trips",       "user",       "userId"],
  ["trips",       "owner",      "userId"],
  ["agenttrips",  "agent",      "agentId"],
  ["budgets",     "trip",       "tripId"],
  ["budgets",     "user",       "userId"],
  ["checklists",  "trip",       "tripId"],
];

const REQUIRED_CHECKS = [
  // [collection, required field, description]
  ["bookings",   "tripId",   "Booking must have tripId"],
  ["bookings",   "agentId",  "Booking must have agentId"],
  ["bookings",   "userId",   "Booking must have userId"],
  ["agenttrips", "agentId",  "AgentTrip must have agentId"],
  ["trips",      "userId",   "Trip must have userId"],
];

async function run() {
  console.log("🔗  Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected.\n");

  const db = mongoose.connection.db;
  let totalIssues = 0;

  // ─── 1. Check for deprecated alias fields ─────────────────────────────────
  console.log("🔍  Checking for deprecated alias fields…\n");

  for (const [col, deprecated, canonical] of CHECKS) {
    const filter = { [deprecated]: { $exists: true } };
    const count = await db.collection(col).countDocuments(filter);
    const samples = count > 0
      ? (await db.collection(col).find(filter).project({ _id: 1 }).limit(5).toArray()).map(d => d._id.toString())
      : [];

    const statusIcon = count === 0 ? "✅" : "❌";
    const canonicalNote = canonical ? `(should be '${canonical}')` : "(should not exist)";
    console.log(`${statusIcon}  ${col}.${deprecated} ${canonicalNote}: ${count} stale docs`);
    if (samples.length) {
      console.log(`      Sample IDs: ${samples.join(", ")}`);
    }
    totalIssues += count;
  }

  // ─── 2. Check required canonical fields are present ───────────────────────
  console.log("\n🔍  Checking required canonical fields are present…\n");

  for (const [col, field, desc] of REQUIRED_CHECKS) {
    const missingFilter = { $or: [{ [field]: { $exists: false } }, { [field]: null }] };
    const count = await db.collection(col).countDocuments(missingFilter);
    const samples = count > 0
      ? (await db.collection(col).find(missingFilter).project({ _id: 1 }).limit(5).toArray()).map(d => d._id.toString())
      : [];

    const statusIcon = count === 0 ? "✅" : "⚠️ ";
    console.log(`${statusIcon}  ${desc}: ${count} docs missing field`);
    if (samples.length) {
      console.log(`      Sample IDs: ${samples.join(", ")}`);
    }
    totalIssues += count;
  }

  // ─── 3. Verify seat count consistency ─────────────────────────────────────
  console.log("\n🔍  Checking AgentTrip seat count consistency…\n");

  const trips = await db.collection("agenttrips").find({}).toArray();
  let seatIssues = 0;
  for (const trip of trips) {
    const booked = trip.bookedSeats ?? 0;
    const available = trip.availableSeats ?? 0;
    const total = trip.totalSeats ?? (booked + available);
    const expectedOccupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
    const storedOccupancy = trip.occupancy ?? 0;

    if (total > 0 && Math.abs(storedOccupancy - expectedOccupancy) > 1) {
      console.log(`⚠️   Trip ${trip._id} (${trip.title}): occupancy mismatch — stored=${storedOccupancy}% expected=${expectedOccupancy}%`);
      seatIssues++;
      totalIssues++;
    }
    if ((booked + available) !== total && total > 0) {
      console.log(`⚠️   Trip ${trip._id} (${trip.title}): seat count mismatch — booked(${booked}) + available(${available}) ≠ total(${total})`);
      seatIssues++;
      totalIssues++;
    }
  }
  if (seatIssues === 0) {
    console.log("✅  All AgentTrip seat counts are consistent.");
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50));
  if (totalIssues === 0) {
    console.log("🎉  SCHEMA VALIDATION PASSED — No issues found.");
  } else {
    console.log(`❌  SCHEMA VALIDATION FAILED — ${totalIssues} issue(s) found.`);
    console.log("    Run: node Backend/scripts/migrateIds.js to fix stale fields.");
  }
  console.log("─".repeat(50));

  await mongoose.disconnect();
  process.exit(totalIssues > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("❌  Validation script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
