import assert from "assert";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Trip from "./models/Trip.js";
import Flight from "./models/Flight.js";
import Notification from "./models/Notification.js";

dotenv.config();

const BASE_URL = process.env.VITE_API_URL || "http://localhost:5000/api";

const logPass = (name) => console.log(`\x1b[32m✓ [PASS] ${name}\x1b[0m`);
const logFail = (name, error) => console.error(`\x1b[31m✗ [FAIL] ${name}: ${error.message}\x1b[0m`);

async function runTests() {
  console.log("=== TRAVELOOP FLIGHT TRACKER & TIMELINE INTEGRATION TEST SUITE ===\n");

  // Connect database
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("❌ Please define the MONGO_URI environment variable.");
  }
  await mongoose.connect(mongoUri);
  console.log("Database connected successfully.\n");

  const emailOwner = `owner_flight_${Date.now()}@test.com`;
  const emailEditor = `editor_flight_${Date.now()}@test.com`;
  const emailViewer = `viewer_flight_${Date.now()}@test.com`;
  const emailEdgeCase = `edge_case_${Date.now()}@test.com`;
  const password = "Password123!";

  let tokenOwner = null;
  let tokenEditor = null;
  let tokenViewer = null;
  let tokenEdgeCase = null;

  let ownerId = null;
  let editorId = null;
  let viewerId = null;
  let edgeCaseId = null;

  let tripId = null;
  let flightId = null;

  try {
    // ----------------------------------------------------
    // TEST CASE 1: Setup Users and Collaboration
    // ----------------------------------------------------
    // 1. Register Owner
    const regOwnerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Flight",
        lastName: "Owner",
        email: emailOwner,
        password,
        phone: "1234567890",
        city: "Mumbai",
        country: "India",
      }),
    });
    const regOwnerData = await regOwnerRes.json();
    assert.strictEqual(regOwnerRes.status, 201, "Owner registration status code");
    tokenOwner = regOwnerData.token;
    ownerId = regOwnerData.user._id;

    // 2. Register Editor
    const regEditorRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Flight",
        lastName: "Editor",
        email: emailEditor,
        password,
        phone: "0987654321",
        city: "Mumbai",
        country: "India",
      }),
    });
    const regEditorData = await regEditorRes.json();
    assert.strictEqual(regEditorRes.status, 201, "Editor registration status code");
    tokenEditor = regEditorData.token;
    editorId = regEditorData.user._id;

    // 3. Register Viewer
    const regViewerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Flight",
        lastName: "Viewer",
        email: emailViewer,
        password,
        phone: "1122334455",
        city: "Mumbai",
        country: "India",
      }),
    });
    const regViewerData = await regViewerRes.json();
    assert.strictEqual(regViewerRes.status, 201, "Viewer registration status code");
    tokenViewer = regViewerData.token;
    viewerId = regViewerData.user._id;

    logPass("Setup: Registered Owner, Editor, and Viewer accounts");

    // 4. Create Trip
    const tripRes = await fetch(`${BASE_URL}/trips/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({
        title: "Flight Test Trip",
        destination: "Dubai, UAE",
        startDate: "2026-09-01",
        endDate: "2026-09-07",
        budget: 150000,
        destinationName: "Dubai",
        placeId: "ChIJRzdg399u5kcRYJSMaMOCCwQ",
        formattedAddress: "Dubai, UAE",
        country: "UAE",
        latitude: 25.2048,
        longitude: 55.2708,
      }),
    });
    const tripData = await tripRes.json();
    assert.strictEqual(tripRes.status, 201, "Trip creation status code");
    tripId = tripData.trip._id;
    logPass("Setup: Created trip as Owner");

    // 5. Invite Editor
    const inviteEdRes = await fetch(`${BASE_URL}/trips/${tripId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({ email: emailEditor, role: "editor" }),
    });
    assert.strictEqual(inviteEdRes.status, 200, "Editor invitation sent");

    // 6. Invite Viewer
    const inviteVwRes = await fetch(`${BASE_URL}/trips/${tripId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({ email: emailViewer, role: "viewer" }),
    });
    assert.strictEqual(inviteVwRes.status, 200, "Viewer invitation sent");

    // 7. Editor accepts invitation
    const notifEdRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenEditor}` },
    });
    const notifEdData = await notifEdRes.json();
    const edInviteNotif = notifEdData.notifications.find(n => n.isInvite && (n.trip?._id || n.trip)?.toString() === tripId.toString());
    assert.ok(edInviteNotif, "Editor invite notification found");
    const acceptEdRes = await fetch(`${BASE_URL}/trips/invite/${edInviteNotif._id}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEditor}` },
    });
    assert.strictEqual(acceptEdRes.status, 200, "Editor accepted invite");

    // 8. Viewer accepts invitation
    const notifVwRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenViewer}` },
    });
    const notifVwData = await notifVwRes.json();
    const vwInviteNotif = notifVwData.notifications.find(n => n.isInvite && (n.trip?._id || n.trip)?.toString() === tripId.toString());
    assert.ok(vwInviteNotif, "Viewer invite notification found");
    const acceptVwRes = await fetch(`${BASE_URL}/trips/invite/${vwInviteNotif._id}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenViewer}` },
    });
    assert.strictEqual(acceptVwRes.status, 200, "Viewer accepted invite");

    logPass("Setup: Accepted invitations and configured Roles (Owner, Editor, Viewer)");

    // ----------------------------------------------------
    // TEST CASE 2: Security Boundaries (Viewer is read-only)
    // ----------------------------------------------------
    // 1. Viewer tries to add flight (Should fail with 403)
    const addVwRes = await fetch(`${BASE_URL}/flights/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenViewer}`,
      },
      body: JSON.stringify({
        tripId,
        flightNumber: "AI302",
        airline: "Air India",
        departureDate: "2026-09-01",
      }),
    });
    const addVwData = await addVwRes.json();
    assert.strictEqual(addVwRes.status, 403, "Viewer should be blocked from adding flights");
    assert.strictEqual(addVwData.success, false);
    logPass("Security: Viewer write block on Flight addition verified");

    // ----------------------------------------------------
    // TEST CASE 3: Editor & Owner Write Access, Mock Fallback
    // ----------------------------------------------------
    // 1. Editor adds flight (Should succeed and trigger API/Mock data)
    const addEdRes = await fetch(`${BASE_URL}/flights/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenEditor}`,
      },
      body: JSON.stringify({
        tripId,
        flightNumber: "AI302",
        airline: "Air India",
        departureDate: "2026-09-01",
      }),
    });
    const addEdData = await addEdRes.json();
    assert.strictEqual(addEdRes.status, 201, "Editor successfully added flight");
    assert.strictEqual(addEdData.success, true);
    assert.ok(addEdData.flight, "Flight object exists in response");
    flightId = addEdData.flight._id;

    // Check mock fallback values
    assert.strictEqual(addEdData.flight.departureAirport, "DEL", "Mock flight departure airport");
    assert.strictEqual(addEdData.flight.arrivalAirport, "NRT", "Mock flight arrival airport");
    assert.strictEqual(addEdData.flight.terminal, "T3", "Mock flight terminal");
    assert.strictEqual(addEdData.flight.gate, "G14", "Mock flight gate");
    assert.strictEqual(addEdData.flight.status, "scheduled", "Mock flight initial status");
    logPass("Flights: Editor flight creation with Mock Engine Fallback verified");

    // ----------------------------------------------------
    // TEST CASE 4: Update Flights and Notification Triggers
    // ----------------------------------------------------
    // Clear old notifications first to avoid interference
    await Notification.deleteMany({ trip: tripId });

    // 1. Editor updates flight status to 'delayed' and delay to 45 mins, and gate to 'G20'
    const updateRes = await fetch(`${BASE_URL}/flights/${flightId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenEditor}`,
      },
      body: JSON.stringify({
        status: "delayed",
        delayMinutes: 45,
        gate: "G20",
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200, "Update flight details success");
    assert.strictEqual(updateData.flight.status, "delayed", "Flight status updated to delayed");
    assert.strictEqual(updateData.flight.delayMinutes, 45, "Flight delay updated to 45");
    assert.strictEqual(updateData.flight.gate, "G20", "Flight gate updated to G20");
    logPass("Flights: Editor manual flight override (delay, gate, status) verified");

    // 2. Verify that notifications were generated for collaborators (Owner & Viewer)
    const ownerNotifs = await Notification.find({ user: ownerId, trip: tripId });
    const viewerNotifs = await Notification.find({ user: viewerId, trip: tripId });

    // There should be 2 notifications per user: one for status change (delayed), and one for gate change (G14 -> G20)
    assert.ok(ownerNotifs.length >= 2, "Notifications created for owner");
    assert.ok(viewerNotifs.length >= 2, "Notifications created for viewer");

    const delayNotif = ownerNotifs.find(n => n.title.includes("Flight Delayed"));
    const gateNotif = ownerNotifs.find(n => n.title.includes("Gate Changed"));
    assert.ok(delayNotif, "Flight Delay notification verified");
    assert.ok(gateNotif, "Flight Gate Change notification verified");
    logPass("Notifications: Status & Gate update database triggers verified");

    // ----------------------------------------------------
    // TEST CASE 5: GET Trip Flights & Live Status Refresh Cooldown
    // ----------------------------------------------------
    // 1. Viewer fetches flights (allowed)
    const listRes = await fetch(`${BASE_URL}/flights/trip/${tripId}`, {
      headers: { Authorization: `Bearer ${tokenViewer}` },
    });
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200, "Viewer listed flights successfully");
    assert.strictEqual(listData.flights.length, 1, "Correct number of flights retrieved");
    logPass("Security: Viewer read access for flight list verified");

    // 2. Trigger status refresh cooldown (should return cached: true because less than 5 minutes)
    const refreshRes = await fetch(`${BASE_URL}/flights/${flightId}/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenOwner}` },
    });
    const refreshData = await refreshRes.json();
    assert.strictEqual(refreshRes.status, 200, "Status refresh success");
    assert.strictEqual(refreshData.cached, true, "Refresh triggered cooldown and returned cached response");
    logPass("Flights: API Cache Cooldown safety check verified");

    // ----------------------------------------------------
    // TEST CASE 6: Edge Case - Valid Token but /auth/me returns USER_NOT_FOUND
    // ----------------------------------------------------
    // 1. Register a temporary user
    const regEdgeRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Edge",
        lastName: "Case",
        email: emailEdgeCase,
        password,
        phone: "9988776655",
        city: "Mumbai",
        country: "India",
      }),
    });
    const regEdgeData = await regEdgeRes.json();
    assert.strictEqual(regEdgeRes.status, 201, "Temporary user registration success");
    tokenEdgeCase = regEdgeData.token;
    edgeCaseId = regEdgeData.user._id;

    // 2. Fetch /auth/me with valid token -> Should return 200 success
    const meBeforeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenEdgeCase}` },
    });
    const meBeforeData = await meBeforeRes.json();
    assert.strictEqual(meBeforeRes.status, 200, "Get me before deletion success");
    assert.strictEqual(meBeforeData.success, true);
    assert.strictEqual(meBeforeData.user.email, emailEdgeCase);

    // 3. Delete the user directly in MongoDB to simulate user deleted/disabled
    const dbDeleteResult = await User.deleteOne({ _id: edgeCaseId });
    assert.strictEqual(dbDeleteResult.deletedCount, 1, "Database deletion confirmed");

    // 4. Fetch /auth/me with same token -> Should return 401 and "USER_NOT_FOUND" code
    const meAfterRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenEdgeCase}` },
    });
    const meAfterData = await meAfterRes.json();
    assert.strictEqual(meAfterRes.status, 401, "Get me after deletion should return 401");
    assert.strictEqual(meAfterData.success, false);
    assert.strictEqual(meAfterData.code, "USER_NOT_FOUND", "Expected USER_NOT_FOUND code in body");
    logPass("Auth: Edge-case of deleted user / valid token handling in /auth/me verified");

  } catch (err) {
    logFail("Tests failed", err);
    await cleanup();
    process.exit(1);
  }

  await cleanup();

  console.log("\n===========================================");
  console.log("All flight and timeline test cases passed! 🎉");
  console.log("===========================================\n");
}

async function cleanup() {
  console.log("Cleaning up test database records...");
  try {
    // Delete test users
    await User.deleteMany({
      email: {
        $in: [
          /owner_flight_/,
          /editor_flight_/,
          /viewer_flight_/,
          /edge_case_/
        ]
      }
    });

    // Delete flights, trips, and notifications created in test
    await Flight.deleteMany({});
    await Trip.deleteMany({ title: "Flight Test Trip" });
    await Notification.deleteMany({});

    console.log("Cleanup completed.");
  } catch (e) {
    console.error("Cleanup failed:", e);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
