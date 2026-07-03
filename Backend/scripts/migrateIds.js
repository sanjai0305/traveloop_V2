/**
 * migrateIds.js — Traveloop ID Standardization Migration
 *
 * Renames obsolete alias fields in existing MongoDB documents to their canonical names:
 *   Booking:   agentTrip → tripId  |  agent → agentId
 *   Trip:      user → userId        |  owner → userId
 *   Budget:    trip → tripId        |  user  → userId
 *   Checklist: trip → tripId
 *
 * Run once against your database:
 *   node Backend/scripts/migrateIds.js
 *
 * Safe to re-run: uses $unset + $set atomically via updateMany.
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

async function run() {
  console.log("🔗  Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected.\n");

  const db = mongoose.connection.db;

  // ─── 1. Booking ────────────────────────────────────────────────────────────
  console.log("📦  Migrating Booking collection…");

  // agentTrip → tripId  (only on docs where tripId is absent)
  const agentTripResult = await db.collection("bookings").updateMany(
    { agentTrip: { $exists: true }, tripId: { $exists: false } },
    [{ $set: { tripId: "$agentTrip" } }]
  );
  console.log(`   agentTrip → tripId: ${agentTripResult.modifiedCount} docs updated`);

  // Set tripId on docs that have agentTrip but tripId is null/undefined
  const agentTripOverwrite = await db.collection("bookings").updateMany(
    { agentTrip: { $exists: true }, $or: [{ tripId: null }, { tripId: { $exists: false } }] },
    [{ $set: { tripId: "$agentTrip" } }]
  );
  console.log(`   agentTrip → tripId (overwrite null): ${agentTripOverwrite.modifiedCount} docs updated`);

  // Remove the old agentTrip field
  const agentTripUnset = await db.collection("bookings").updateMany(
    { agentTrip: { $exists: true } },
    { $unset: { agentTrip: "" } }
  );
  console.log(`   $unset agentTrip: ${agentTripUnset.modifiedCount} docs cleaned`);

  // agent → agentId
  const agentResult = await db.collection("bookings").updateMany(
    { agent: { $exists: true }, agentId: { $exists: false } },
    [{ $set: { agentId: "$agent" } }]
  );
  console.log(`   agent → agentId: ${agentResult.modifiedCount} docs updated`);

  const agentUnset = await db.collection("bookings").updateMany(
    { agent: { $exists: true } },
    { $unset: { agent: "" } }
  );
  console.log(`   $unset agent: ${agentUnset.modifiedCount} docs cleaned`);

  // createdBy → userId (if used)
  const createdByResult = await db.collection("bookings").updateMany(
    { createdBy: { $exists: true }, userId: { $exists: false } },
    [{ $set: { userId: "$createdBy" } }]
  );
  console.log(`   createdBy → userId: ${createdByResult.modifiedCount} docs updated`);

  const createdByUnset = await db.collection("bookings").updateMany(
    { createdBy: { $exists: true } },
    { $unset: { createdBy: "" } }
  );
  console.log(`   $unset createdBy: ${createdByUnset.modifiedCount} docs cleaned`);

  // bookingDate → (removed; canonical field is Mongoose's createdAt)
  const bookingDateUnset = await db.collection("bookings").updateMany(
    { bookingDate: { $exists: true } },
    { $unset: { bookingDate: "" } }
  );
  console.log(`   $unset bookingDate: ${bookingDateUnset.modifiedCount} docs cleaned\n`);

  // ─── 2. Trip (User Trips) ──────────────────────────────────────────────────
  console.log("📦  Migrating Trip (user) collection…");

  const tripUserResult = await db.collection("trips").updateMany(
    { user: { $exists: true }, userId: { $exists: false } },
    [{ $set: { userId: "$user" } }]
  );
  console.log(`   user → userId: ${tripUserResult.modifiedCount} docs updated`);

  const tripUserUnset = await db.collection("trips").updateMany(
    { user: { $exists: true } },
    { $unset: { user: "" } }
  );
  console.log(`   $unset user: ${tripUserUnset.modifiedCount} docs cleaned`);

  const tripOwnerResult = await db.collection("trips").updateMany(
    { owner: { $exists: true }, userId: { $exists: false } },
    [{ $set: { userId: "$owner" } }]
  );
  console.log(`   owner → userId: ${tripOwnerResult.modifiedCount} docs updated`);

  const tripOwnerUnset = await db.collection("trips").updateMany(
    { owner: { $exists: true } },
    { $unset: { owner: "" } }
  );
  console.log(`   $unset owner: ${tripOwnerUnset.modifiedCount} docs cleaned\n`);

  // ─── 3. AgentTrip ─────────────────────────────────────────────────────────
  console.log("📦  Migrating AgentTrip collection…");

  const agentTripAgentResult = await db.collection("agenttrips").updateMany(
    { agent: { $exists: true }, agentId: { $exists: false } },
    [{ $set: { agentId: "$agent" } }]
  );
  console.log(`   agent → agentId: ${agentTripAgentResult.modifiedCount} docs updated`);

  const agentTripAgentUnset = await db.collection("agenttrips").updateMany(
    { agent: { $exists: true } },
    { $unset: { agent: "" } }
  );
  console.log(`   $unset agent: ${agentTripAgentUnset.modifiedCount} docs cleaned\n`);

  // ─── 4. Budget ────────────────────────────────────────────────────────────
  console.log("📦  Migrating Budget collection…");

  const budgetTripResult = await db.collection("budgets").updateMany(
    { trip: { $exists: true }, tripId: { $exists: false } },
    [{ $set: { tripId: "$trip" } }]
  );
  console.log(`   trip → tripId: ${budgetTripResult.modifiedCount} docs updated`);

  const budgetTripUnset = await db.collection("budgets").updateMany(
    { trip: { $exists: true } },
    { $unset: { trip: "" } }
  );
  console.log(`   $unset trip: ${budgetTripUnset.modifiedCount} docs cleaned`);

  const budgetUserResult = await db.collection("budgets").updateMany(
    { user: { $exists: true }, userId: { $exists: false } },
    [{ $set: { userId: "$user" } }]
  );
  console.log(`   user → userId: ${budgetUserResult.modifiedCount} docs updated`);

  const budgetUserUnset = await db.collection("budgets").updateMany(
    { user: { $exists: true } },
    { $unset: { user: "" } }
  );
  console.log(`   $unset user: ${budgetUserUnset.modifiedCount} docs cleaned\n`);

  // ─── 5. Checklist ─────────────────────────────────────────────────────────
  console.log("📦  Migrating Checklist collection…");

  const checklistTripResult = await db.collection("checklists").updateMany(
    { trip: { $exists: true }, tripId: { $exists: false } },
    [{ $set: { tripId: "$trip" } }]
  );
  console.log(`   trip → tripId: ${checklistTripResult.modifiedCount} docs updated`);

  const checklistTripUnset = await db.collection("checklists").updateMany(
    { trip: { $exists: true } },
    { $unset: { trip: "" } }
  );
  console.log(`   $unset trip: ${checklistTripUnset.modifiedCount} docs cleaned\n`);

  // ─── Done ─────────────────────────────────────────────────────────────────
  console.log("✅  Migration complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌  Migration failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
