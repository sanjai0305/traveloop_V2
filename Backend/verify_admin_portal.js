import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

const logPass = (name) => console.log(`\x1b[32m✓ [PASS] ${name}\x1b[0m`);
const logFail = (name, error) => console.error(`\x1b[31m✗ [FAIL] ${name}: ${error.message || error}\x1b[0m`);

async function runTests() {
  console.log("=== TRAVELOOP ADMIN PORTAL LOGISTICS TEST SUITE ===\n");

  let adminToken = null;
  const adminEmail = "admin@traveloop.com";
  const adminPassword = "adminpassword";

  try {
    // 1. Admin Login (Triggers 2FA)
    console.log("[Test] Initiating admin login...");
    const loginRes = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, "Login credentials check status 200");
    assert.strictEqual(loginData.success, true, "Login success boolean");
    assert.strictEqual(loginData.twoFactorRequired, true, "2FA redirect required flag is true");
    assert.ok(loginData.debugOtp, "Debug OTP returned in development mode");
    logPass("Admin credentials matched & 2FA challenge triggered");

    const debugOtp = loginData.debugOtp;

    // 2. Verify 2FA
    console.log("[Test] Verifying 2FA challenge...");
    const verifyRes = await fetch(`${BASE_URL}/admin/verify-2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, otp: debugOtp }),
    });

    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200, "2FA verification status 200");
    assert.strictEqual(verifyData.success, true, "2FA verification success");
    assert.ok(verifyData.token, "JWT token returned on successful 2FA");
    assert.strictEqual(verifyData.admin.role, "Super Admin", "Admin role matches Super Admin");
    adminToken = verifyData.token;
    logPass("2FA verified successfully & JWT token generated");

    const authHeader = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`,
    };

    // 3. Fetch Admin Profile
    console.log("[Test] Retrieving admin profile...");
    const profileRes = await fetch(`${BASE_URL}/admin/profile`, {
      method: "GET",
      headers: authHeader,
    });
    const profileData = await profileRes.json();
    assert.strictEqual(profileRes.status, 200, "Profile endpoint status 200");
    assert.strictEqual(profileData.success, true, "Profile fetch success flag");
    assert.strictEqual(profileData.admin.email, adminEmail, "Profile email matches");
    logPass("Admin profile retrieved successfully");

    // 4. Seed Mock Data
    console.log("[Test] Seeding admin mock stats...");
    const seedRes = await fetch(`${BASE_URL}/admin/seed`, {
      method: "POST",
      headers: authHeader,
    });
    const seedData = await seedRes.json();
    assert.strictEqual(seedRes.status, 200, "Seeding endpoint status 200");
    assert.strictEqual(seedData.success, true, "Seeding success flag");
    logPass("Admin portal mock data seeded successfully");

    // 5. Retrieve Dashboard Metrics
    console.log("[Test] Fetching dashboard stats...");
    const statsRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      method: "GET",
      headers: authHeader,
    });
    const statsData = await statsRes.json();
    assert.strictEqual(statsRes.status, 200, "Dashboard stats status 200");
    assert.ok(statsData.stats !== undefined || statsData.grossRevenue !== undefined, "Dashboard contains stats");
    logPass("Dashboard metrics aggregated and retrieved");

    // 6. Retrieve Agent Directory
    console.log("[Test] Fetching travel agent list...");
    const agentsRes = await fetch(`${BASE_URL}/admin/agents`, {
      method: "GET",
      headers: authHeader,
    });
    const agentsData = await agentsRes.json();
    assert.strictEqual(agentsRes.status, 200, "Agent directory status 200");
    assert.ok(Array.isArray(agentsData.agents), "Agents listing is an array");
    logPass("Agent moderation directory retrieved");

    // 7. Retrieve Commission Settings & Analytics
    console.log("[Test] Fetching commission analytics...");
    const commRes = await fetch(`${BASE_URL}/admin/commission`, {
      method: "GET",
      headers: authHeader,
    });
    const commData = await commRes.json();
    assert.strictEqual(commRes.status, 200, "Commission details status 200");
    assert.ok(commData.defaultCommissionRate !== undefined, "Default commission returned");
    logPass("Commission analytics and default rate verified");

    // 8. Update Default Commission Rate
    console.log("[Test] Adjusting commission configuration...");
    const updateCommRes = await fetch(`${BASE_URL}/admin/commission`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({ rate: 12 }),
    });
    const updateCommData = await updateCommRes.json();
    assert.strictEqual(updateCommRes.status, 200, "Update commission status 200");
    assert.strictEqual(updateCommData.defaultCommissionRate, 12, "Commission rate updated to 12%");
    
    // Reset back to 10%
    await fetch(`${BASE_URL}/admin/commission`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({ rate: 10 }),
    });
    logPass("Global default marketplace commission rates modified and verified");

    // 9. Fetch Booking Ledger
    console.log("[Test] Fetching booking ledger...");
    const bookingsRes = await fetch(`${BASE_URL}/admin/bookings`, {
      method: "GET",
      headers: authHeader,
    });
    const bookingsData = await bookingsRes.json();
    assert.strictEqual(bookingsRes.status, 200, "Booking ledger status 200");
    assert.ok(Array.isArray(bookingsData.bookings), "Bookings ledger is an array");
    logPass("Booking ledger transaction registry retrieved");

    // 10. Fetch Finance Ledger Details
    console.log("[Test] Fetching general finance details...");
    const finRes = await fetch(`${BASE_URL}/admin/finance`, {
      method: "GET",
      headers: authHeader,
    });
    const finData = await finRes.json();
    assert.strictEqual(finRes.status, 200, "Finance details status 200");
    assert.ok(Array.isArray(finData.settlements), "Settlements list retrieved");
    logPass("Finance details and payouts audited");

    // 11. Fetch Revenue Summary
    console.log("[Test] Fetching revenue details...");
    const revenueRes = await fetch(`${BASE_URL}/admin/revenue`, {
      method: "GET",
      headers: authHeader,
    });
    const revenueData = await revenueRes.json();
    assert.strictEqual(revenueRes.status, 200, "Revenue details status 200");
    assert.ok(revenueData.revenueBreakdown !== undefined, "Revenue details contains breakdown");
    logPass("Financial summaries and escrow amounts retrieved");

    // 12. Fetch Payouts List
    console.log("[Test] Fetching payouts list...");
    const payoutsRes = await fetch(`${BASE_URL}/admin/payouts`, {
      method: "GET",
      headers: authHeader,
    });
    const payoutsData = await payoutsRes.json();
    assert.strictEqual(payoutsRes.status, 200, "Payouts status 200");
    assert.ok(Array.isArray(payoutsData.payouts), "Payouts is an array");
    logPass("Payouts listing retrieved");

    // 13. Fetch Settlements Registry
    console.log("[Test] Fetching settlements list...");
    const settlementsRes = await fetch(`${BASE_URL}/admin/settlements`, {
      method: "GET",
      headers: authHeader,
    });
    const settlementsData = await settlementsRes.json();
    assert.strictEqual(settlementsRes.status, 200, "Settlements status 200");
    assert.ok(Array.isArray(settlementsData.settlements), "Settlements registry is an array");
    logPass("Settlement registry audited");

    // 14. Fetch Packages Approvals List
    console.log("[Test] Fetching trip approvals...");
    const tripsRes = await fetch(`${BASE_URL}/admin/trips`, {
      method: "GET",
      headers: authHeader,
    });
    const tripsData = await tripsRes.json();
    assert.strictEqual(tripsRes.status, 200, "Trip approvals status 200");
    assert.ok(Array.isArray(tripsData.trips), "Trips list is an array");
    logPass("Agent trip publication directory retrieved");

    // 15. Fetch System Notifications
    console.log("[Test] Fetching admin notification alerts...");
    const notifRes = await fetch(`${BASE_URL}/admin/notifications`, {
      method: "GET",
      headers: authHeader,
    });
    const notifData = await notifRes.json();
    assert.strictEqual(notifRes.status, 200, "Notifications listing status 200");
    assert.ok(Array.isArray(notifData.notifications), "Notifications is an array");
    logPass("Marketplace alerts and event logs verified");

    // 16. Admin Logout
    console.log("[Test] Logging out admin...");
    const logoutRes = await fetch(`${BASE_URL}/admin/logout`, {
      method: "POST",
      headers: authHeader,
    });
    const logoutData = await logoutRes.json();
    assert.strictEqual(logoutRes.status, 200, "Logout status 200");
    assert.strictEqual(logoutData.success, true, "Logout success flag");
    logPass("Admin logged out successfully");

    console.log("\n\x1b[32m=== ALL TRAVELOOP ADMIN PORTAL LOGISTICS TESTS PASSED SUCCESSFULLY! ===\x1b[0m\n");

  } catch (error) {
    logFail("Admin Portal Integration Tests", error);
    process.exit(1);
  }
}

runTests();
