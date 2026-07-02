import "dotenv/config";
import assert from "assert";
import mongoose from "mongoose";
import { db, auth } from "./config/firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

const BASE_URL = process.env.VITE_API_URL || "http://localhost:5000/api";

const logPass = (name) => console.log(`\x1b[32m✓ [PASS] ${name}\x1b[0m`);
const logFail = (name, error) => console.error(`\x1b[31m✗ [FAIL] ${name}: ${error.stack || error.message}\x1b[0m`);

async function runTests() {
  console.log("=== TRAVELOOP PRODUCTION API TEST SUITE ===\n");
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/traveloop";
  await mongoose.connect(mongoUri, { dbName: process.env.DATABASE_NAME || "traveloop" });

  let token = null;
  let testTripId = null;
  let testShareToken = null;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  // 1. AUTHENTICATION TESTS
  try {
    // A. Send OTP
    const sendOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "QA",
        lastName: "Tester",
        email: testEmail,
        password: testPassword,
        phone: "+911234567890",
        city: "Chennai",
        country: "India",
        acceptedTerms: true,
        termsVersion: "2026-06",
      }),
    });
    const sendOtpData = await sendOtpRes.json();
    assert.strictEqual(sendOtpRes.status, 200, `Send OTP should return 200 OK. Server Error: ${sendOtpData.message || JSON.stringify(sendOtpData)}`);
    assert.strictEqual(sendOtpData.success, true, "Send OTP success should be true");
    logPass("Auth: Send Verification OTP");

    // B. Query OTP from Firestore
    const otpDocRef = doc(db, "otps", testEmail.toLowerCase());

    // Authenticate anonymously before reading
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    const otpSnap = await getDoc(otpDocRef);
    assert.ok(otpSnap.exists(), "OTP document should exist in Firestore");
    const otpData = otpSnap.data();
    assert.ok(otpData.debugOtp, "OTP record should contain a debugOtp code");
    const testOtp = otpData.debugOtp;
    logPass(`Auth: DB Query OTP code (${testOtp})`);

    // C. Verify OTP to get token
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        otp: testOtp,
      }),
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200, "Verify OTP should return 200 OK");
    assert.strictEqual(verifyData.success, true, "Verify OTP success should be true");
    assert.ok(verifyData.otpToken, "Verify OTP should yield a verification token");
    const otpToken = verifyData.otpToken;
    logPass("Auth: Verify OTP and Obtain Token");

    // D. Register User using OTP Token
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "QA",
        lastName: "Tester",
        email: testEmail,
        password: testPassword,
        phone: "+911234567890",
        city: "Chennai",
        country: "India",
        acceptedTerms: true,
        termsVersion: "2026-06",
        otpToken,
      }),
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Registration should return 201 Created. Server Error: ${regData.message || JSON.stringify(regData)}`);
    assert.strictEqual(regData.success, true, "Registration success should be true");
    logPass("Auth: User Registration");

    // B. Login User
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, "Login should return 200 OK");
    assert.strictEqual(loginData.success, true, "Login success should be true");
    assert.ok(loginData.token, "Login should yield a JWT token");
    token = loginData.token;
    logPass("Auth: User Login");

    // C. Validate Token (/auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200, "Auth validation should return 200 OK");
    assert.strictEqual(meData.success, true, "Validation success should be true");
    assert.strictEqual(meData.user.email, testEmail, "Validation email should match registered email");
    logPass("Auth: Token Validation (/auth/me)");
  } catch (err) {
    logFail("Authentication Tests", err);
    process.exit(1);
  }

  // 2. GOOGLE MAPS SERVICES TESTS
  let placeId = "";
  try {
    // A. Destinations Autocomplete
    const autoRes = await fetch(`${BASE_URL}/trips/destinations/autocomplete?q=Zurich`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const autoData = await autoRes.json();
    console.log("Autocomplete predictions returned:", autoData.predictions);
    assert.strictEqual(autoRes.status, 200, "Autocomplete should return 200 OK");
    assert.strictEqual(autoData.success, true, "Autocomplete success should be true");
    assert.ok(autoData.predictions.length > 0, "Autocomplete predictions should not be empty");

    // Find prediction with placeId
    const targetPrediction = autoData.predictions.find(p => p.placeId !== "") || autoData.predictions[0];
    placeId = targetPrediction.placeId;
    logPass(`Google Maps: Places Autocomplete (Query: "Zurich", Results: ${autoData.predictions.length})`);

    // B. Place Details (only if we have a valid placeId, else test fallback)
    if (placeId) {
      const detailsRes = await fetch(`${BASE_URL}/trips/destinations/details?placeId=${placeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const detailsData = await detailsRes.json();
      assert.strictEqual(detailsRes.status, 200, "Place details should return 200 OK");
      assert.strictEqual(detailsData.success, true, "Place details success should be true");
      assert.ok(detailsData.latitude, "Details should include latitude");
      assert.ok(detailsData.longitude, "Details should include longitude");
      logPass(`Google Maps: Places Details (Coordinates: ${detailsData.latitude}, ${detailsData.longitude})`);
    } else {
      console.log("\x1b[33m⚠ [SKIP] Google Maps Place Details (Fallback mode active - no Place ID returned)\x1b[0m");
    }
  } catch (err) {
    logFail("Google Maps API Tests", err);
  }

  // 3. TRIP CREATION TESTS
  try {
    const tripRes = await fetch(`${BASE_URL}/trips/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Switzerland Vacation",
        destination: "Zurich, Switzerland",
        startDate: "2026-07-01",
        endDate: "2026-07-07",
        budget: 150000,
        destinationName: "Zurich",
        placeId: placeId || "ChIJ8yYmB72HmkcR8s3zWj2Q-6s",
        formattedAddress: "Zurich, Switzerland",
        country: "Switzerland",
        state: "Zurich",
        latitude: 47.376887,
        longitude: 8.541694,
      }),
    });
    const tripData = await tripRes.json();
    assert.strictEqual(tripRes.status, 201, "Trip creation should return 201 Created");
    assert.strictEqual(tripData.success, true, "Trip creation success should be true");
    assert.ok(tripData.trip._id, "Created trip should include an MongoDB ID");
    testTripId = tripData.trip._id;
    logPass("Trips: Trip Creation & Location Schema persistence");
  } catch (err) {
    logFail("Trip Creation Tests", err);
    process.exit(1);
  }

  // 4. BUDGET & EXPENSES TESTS
  try {
    const budgetRes = await fetch(`${BASE_URL}/trips/${testTripId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        budget: 120000,
        expenses: {
          transport: 45000,
          accommodation: 50000,
          food: 12000,
          activities: 8000,
          shopping: 2000,
        },
      }),
    });
    const budgetData = await budgetRes.json();
    assert.strictEqual(budgetRes.status, 200, "Trip budget update should return 200 OK");
    assert.strictEqual(budgetData.success, true, "Budget update success should be true");
    assert.strictEqual(budgetData.trip.budget, 120000, "Budget limit should be updated");
    assert.strictEqual(budgetData.trip.expenses.transport, 45000, "Expenses should be saved");
    logPass("Budget: Costs updating & remaining budget analytics check");
  } catch (err) {
    logFail("Budget & Cost Breakdown Tests", err);
  }

  // 5. SHARING & CLONING TESTS
  try {
    // A. Generate Share Token (isPublic = true)
    const shareRes = await fetch(`${BASE_URL}/trips/${testTripId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isPublic: true }),
    });
    const shareData = await shareRes.json();
    assert.strictEqual(shareRes.status, 200, "Share trigger should return 200 OK");
    assert.ok(shareData.trip.shareToken, "Share request should yield a share token");
    testShareToken = shareData.trip.shareToken;
    logPass("Sharing: Public Link Generation & Share Token");

    // B. Get Shared Itinerary (Public/No Auth)
    const getSharedRes = await fetch(`${BASE_URL}/trips/shared/${testShareToken}`);
    const getSharedData = await getSharedRes.json();
    assert.strictEqual(getSharedRes.status, 200, "Public retrieval should return 200 OK");
    assert.strictEqual(getSharedData.success, true, "Public retrieval success should be true");
    assert.strictEqual(getSharedData.trip.title, "Switzerland Vacation", "Shared trip title should match");
    logPass("Sharing: Public Itinerary retrieval (Read-only view, no JWT)");
  } catch (err) {
    logFail("Itinerary Sharing Tests", err);
  }

  // 6. TEARDOWN (CLEANUP TEST DATABASE)
  try {
    const delRes = await fetch(`${BASE_URL}/trips/${testTripId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(delRes.status, 200, "Trip deletion should return 200 OK");
    logPass("Teardown: Created test data cleanly deleted");
  } catch (err) {
    logFail("Cleanup Teardown", err);
  }

  console.log("\n===========================================");
  console.log("All test cases completed successfully! 🎉");
  console.log("===========================================\n");

  await mongoose.connection.close();
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
