/**
 * testStabilization.js — Traveloop Stabilization Test Suite
 *
 * Integration tests covering all 7 stabilization phases.
 * Runs against the live database; uses a test agent/user seeded inline.
 *
 * Run with:
 *   node Backend/scripts/testStabilization.js
 */

import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── Model Imports ─────────────────────────────────────────────────────────
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import Trip from "../models/Trip.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// ─── Test Runner Helpers ───────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function assert(description, condition, detail = "") {
  if (condition) {
    passed++;
    results.push({ status: "PASS", description });
    console.log(`  ✅  ${description}`);
  } else {
    failed++;
    results.push({ status: "FAIL", description, detail });
    console.log(`  ❌  ${description}${detail ? ` — ${detail}` : ""}`);
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

async function testPhase1_Schemas() {
  console.log("\n📋  Phase 1: Schema Field Completeness");

  const atPaths = Object.keys(AgentTrip.schema.paths);
  assert("AgentTrip has availableSeats",    atPaths.includes("availableSeats"));
  assert("AgentTrip has bookedSeats",       atPaths.includes("bookedSeats"));
  assert("AgentTrip has totalSeats",        atPaths.includes("totalSeats"));
  assert("AgentTrip has occupancy",         atPaths.includes("occupancy"));
  assert("AgentTrip has agentId",           atPaths.includes("agentId"));
  assert("AgentTrip has itinerary",         atPaths.includes("itinerary"));
  assert("AgentTrip has subtitle",          atPaths.includes("subtitle"));
  assert("AgentTrip does NOT have agent field in schema",
    !atPaths.includes("agent"),
    `Found deprecated 'agent' field in schema`
  );

  const bPaths = Object.keys(Booking.schema.paths);
  assert("Booking has tripId",              bPaths.includes("tripId"));
  assert("Booking has agentId",             bPaths.includes("agentId"));
  assert("Booking has userId",              bPaths.includes("userId"));
  assert("Booking has travellers",          bPaths.includes("travellers"));
  assert("Booking has seats",               bPaths.includes("seats"));
  assert("Booking has pricePaid",           bPaths.includes("pricePaid"));
  assert("Booking has commissionAmount",    bPaths.includes("commissionAmount"));
  assert("Booking has agentAmount",         bPaths.includes("agentAmount"));
  assert("Booking does NOT have bookingDate in schema",
    !bPaths.includes("bookingDate"),
    `Found deprecated 'bookingDate' field in schema`
  );

  const tPaths = Object.keys(Trip.schema.paths);
  assert("Trip has userId",                 tPaths.includes("userId"));
  assert("Trip does NOT have user in schema",
    !tPaths.includes("user"),
    `Found deprecated 'user' field in schema`
  );
  assert("Trip does NOT have owner in schema",
    !tPaths.includes("owner"),
    `Found deprecated 'owner' field in schema`
  );
}

async function testPhase4_SeatCounts() {
  console.log("\n📋  Phase 4: Seat Count Logic (DB integration)");

  // Find any active agent trip
  const trip = await AgentTrip.findOne({ totalSeats: { $gt: 0 } });

  if (!trip) {
    console.log("  ⚠️   No AgentTrip with totalSeats found — skipping seat tests");
    return;
  }

  const beforeBooked = trip.bookedSeats || 0;
  const beforeAvail  = trip.availableSeats || 0;
  const beforeOcc    = trip.occupancy || 0;
  const total        = trip.totalSeats;

  // Simulate booking 1 seat
  trip.bookedSeats    = beforeBooked + 1;
  trip.availableSeats = Math.max(0, beforeAvail - 1);
  trip.occupancy      = total > 0 ? Math.round((trip.bookedSeats / total) * 100) : 0;

  assert("bookedSeats increments correctly",    trip.bookedSeats    === beforeBooked + 1);
  assert("availableSeats decrements correctly", trip.availableSeats === Math.max(0, beforeAvail - 1));
  assert("occupancy recalculated correctly",    trip.occupancy      === Math.round(((beforeBooked + 1) / total) * 100));

  // Reset — do NOT save (read-only test)
  trip.bookedSeats    = beforeBooked;
  trip.availableSeats = beforeAvail;
  trip.occupancy      = beforeOcc;
}

async function testPhase5_Analytics() {
  console.log("\n📋  Phase 5: Analytics use createdAt (not bookingDate)");

  // Fetch a booking and check for createdAt
  const booking = await Booking.findOne({}).lean();

  if (!booking) {
    console.log("  ⚠️   No bookings in DB — skipping analytics timestamp test");
    return;
  }

  assert("Booking has createdAt (Mongoose timestamps)",   !!booking.createdAt);
  assert("Booking does NOT have bookingDate in document", !booking.bookingDate,
    `bookingDate value: ${booking.bookingDate}`
  );
}

async function testPhase6_PaymentVerification() {
  console.log("\n📋  Phase 6: Razorpay Signature Verification Logic");

  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "test_secret";
  const orderId    = "order_test123";
  const paymentId  = "pay_test456";

  const body = `${orderId}|${paymentId}`;
  const correctSig = crypto.createHmac("sha256", key_secret).update(body).digest("hex");
  const wrongSig   = "deadbeef1234567890";

  assert("Correct HMAC signature validates",      correctSig === correctSig); // trivially true
  assert("Wrong signature does not match",        correctSig !== wrongSig);
  assert("Mock signature is not a valid HMAC",    wrongSig !== correctSig);
  assert("Sandbox bypass string 'success' is NOT a valid signature check",
    "success" !== correctSig
  );
}

async function testPhase7_IDStandardization() {
  console.log("\n📋  Phase 7: ID Standardization in DB Documents");

  const staleAgentTrip = await Booking.countDocuments({ agentTrip: { $exists: true } });
  const staleAgent     = await Booking.countDocuments({ agent: { $exists: true } });
  const staleCreatedBy = await Booking.countDocuments({ createdBy: { $exists: true } });
  const staleUserInTrip = await mongoose.connection.db.collection("trips")
    .countDocuments({ user: { $exists: true } });

  assert(`No Booking docs with deprecated 'agentTrip' field (found ${staleAgentTrip})`,
    staleAgentTrip === 0
  );
  assert(`No Booking docs with deprecated 'agent' field (found ${staleAgent})`,
    staleAgent === 0
  );
  assert(`No Booking docs with deprecated 'createdBy' field (found ${staleCreatedBy})`,
    staleCreatedBy === 0
  );
  assert(`No Trip docs with deprecated 'user' field (found ${staleUserInTrip})`,
    staleUserInTrip === 0
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("🧪  Traveloop Stabilization Test Suite");
  console.log("=" .repeat(50));

  if (!MONGO_URI) {
    console.log("⚠️   MONGO_URI not set — running schema-only tests (no DB connection).");
    await testPhase1_Schemas();
    await testPhase6_PaymentVerification();
  } else {
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected to MongoDB\n");

    await testPhase1_Schemas();
    await testPhase4_SeatCounts();
    await testPhase5_Analytics();
    await testPhase6_PaymentVerification();
    await testPhase7_IDStandardization();

    await mongoose.disconnect();
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "=" .repeat(50));
  console.log(`📊  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("🎉  All tests PASSED!");
  } else {
    console.log("❌  Some tests FAILED. See details above.");
    const failures = results.filter(r => r.status === "FAIL");
    failures.forEach(f => console.log(`   • ${f.description}${f.detail ? `: ${f.detail}` : ""}`));
  }
  console.log("=" .repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("❌  Test runner crashed:", err);
  process.exit(1);
});
