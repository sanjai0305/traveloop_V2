// Backend/verify_multibudget.js
import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

const logPass = (name) => console.log(`\x1b[32m✓ [PASS] ${name}\x1b[0m`);
const logFail = (name, error) => console.error(`\x1b[31m✗ [FAIL] ${name}: ${error.message}\x1b[0m`);

async function runTests() {
  console.log("=== TRAVELOOP MULTI-BUDGET & SYNC TEST SUITE ===\n");
  
  let token = null;
  let tripId = null;
  let defaultBudgetId = null;
  let luxuryBudgetId = null;
  let duplicateBudgetId = null;
  let itinItemId = null;

  const testEmail = `multibudget_tester_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  try {
    // 1. Setup User
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Multi",
        lastName: "Tester",
        email: testEmail,
        password: testPassword,
        phone: "9999999999",
        city: "Mumbai",
        country: "India",
      }),
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, "User registration should succeed");
    token = regData.token;

    logPass("Setup: Registered user account");

    // 2. Create Trip with Budget 150000
    const tripRes = await fetch(`${BASE_URL}/trips/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Switzerland Tour",
        destination: "Zurich",
        startDate: "2026-08-15",
        endDate: "2026-08-25",
        budget: 150000,
      }),
    });
    const tripData = await tripRes.json();
    assert.strictEqual(tripRes.status, 201, "Trip creation should succeed");
    tripId = tripData.trip._id;

    logPass("Setup: Created trip with Budget = ₹150,000");

    // 3. Get Budgets list (should auto-bootstrap a default active budget)
    const getBudgetsRes = await fetch(`${BASE_URL}/budgets/${tripId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getBudgetsData = await getBudgetsRes.json();
    assert.strictEqual(getBudgetsRes.status, 200);
    assert.strictEqual(getBudgetsData.budgets.length, 1, "Should auto-bootstrap exactly one budget");
    assert.strictEqual(getBudgetsData.budgets[0].totalBudget, 150000, "Bootstrapped budget should copy trip budget");
    assert.strictEqual(getBudgetsData.budgets[0].isActive, true, "Bootstrapped budget should be active");
    defaultBudgetId = getBudgetsData.budgets[0]._id;

    logPass("Multi-budget: Verified auto-bootstrapping of active default budget (Limit: ₹150,000)");

    // 4. Create second budget: "Luxury Budget" (Limit: ₹500,000)
    const createRes = await fetch(`${BASE_URL}/budgets/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        tripId,
        budgetName: "Luxury Budget",
        totalBudget: 500000,
        currency: "INR",
        category: "Friends Trip"
      })
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createData.budget.budgetName, "Luxury Budget");
    assert.strictEqual(createData.budget.totalBudget, 500000);
    assert.strictEqual(createData.budget.isActive, true, "New budget should be active");
    luxuryBudgetId = createData.budget._id;

    // Retrieve all budgets again to verify previous budget is deactivated
    const getBudgetsRes2 = await fetch(`${BASE_URL}/budgets/${tripId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getBudgetsData2 = await getBudgetsRes2.json();
    const prevBudget = getBudgetsData2.budgets.find(b => b._id === defaultBudgetId);
    assert.strictEqual(prevBudget.isActive, false, "Previous default budget should be deactivated");

    logPass("Multi-budget: Successfully created 'Luxury Budget' (Limit: ₹500,000) and deactivated old budget");

    // 5. Create an Itinerary item of cost 60000 (valid under both)
    const itinRes = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        trip: tripId,
        day: 1,
        time: "12:00",
        title: "Grand Palace Hotel Stay",
        category: "stay",
        budget: 60000
      })
    });
    const itinData = await itinRes.json();
    assert.strictEqual(itinRes.status, 201);
    itinItemId = itinData.itinerary._id;

    // Check active budget plannedExpense is updated
    const getBudgetsRes3 = await fetch(`${BASE_URL}/budgets/${tripId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getBudgetsData3 = await getBudgetsRes3.json();
    const activeB = getBudgetsData3.budgets.find(b => b._id === luxuryBudgetId);
    assert.strictEqual(activeB.plannedExpense, 60000, "Active budget plannedExpense should sync to 60000");
    assert.strictEqual(activeB.categories.accommodation.planned, 60000, "Accommodation category planned should update to 60000");

    logPass("Sync: Created itinerary activity (cost ₹60,000) and verified auto-sync on active budget");

    // 6. Test Switch back to default budget (limit 150000)
    const activateRes = await fetch(`${BASE_URL}/budgets/activate/${defaultBudgetId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    const activateData = await activateRes.json();
    assert.strictEqual(activateRes.status, 200);
    assert.strictEqual(activateData.budget.isActive, true, "Default budget should be active now");
    assert.strictEqual(activateData.budget.plannedExpense, 60000, "Sync engine should have recalculated default budget plannedExpense to 60000");

    logPass("Switch: Activated default budget and verified recalculation sync");

    // 7. Test budget limit validation check: Add itinerary activity of cost 100000
    // Total planned would be 60000 + 100000 = 160000, which exceeds 150000 limit
    const itinFailRes = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        trip: tripId,
        day: 2,
        time: "10:00",
        title: "Helicopter Skiing",
        category: "activities",
        budget: 100000
      })
    });
    assert.strictEqual(itinFailRes.status, 400, "Should reject with 400 because limit is exceeded");

    logPass("Validation: Rejected addition of ₹100,000 itinerary item (would exceed active budget limit ₹150,000)");

    // 8. Switch to Luxury Budget (limit 500000) and retry adding the 100000 item
    await fetch(`${BASE_URL}/budgets/activate/${luxuryBudgetId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    const itinSuccessRes = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        trip: tripId,
        day: 2,
        time: "10:00",
        title: "Helicopter Skiing",
        category: "activities",
        budget: 100000
      })
    });
    assert.strictEqual(itinSuccessRes.status, 201, "Should accept now since active budget limit is 500000");

    logPass("Validation: Accepted ₹100,000 itinerary item after switching to Luxury Budget (Limit: ₹500,000)");

    // 9. Duplicate the active budget
    const dupRes = await fetch(`${BASE_URL}/budgets/duplicate/${luxuryBudgetId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const dupData = await dupRes.json();
    assert.strictEqual(dupRes.status, 201);
    assert.strictEqual(dupData.budget.budgetName, "Luxury Budget (copy)");
    assert.strictEqual(dupData.budget.isActive, true, "Duplicated budget should be active");
    duplicateBudgetId = dupData.budget._id;

    logPass("Duplicate: Successfully duplicated active budget to 'Luxury Budget (copy)'");

    // 10. Archive budget
    const archRes = await fetch(`${BASE_URL}/budgets/archive/${duplicateBudgetId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    const archData = await archRes.json();
    assert.strictEqual(archRes.status, 200);
    assert.strictEqual(archData.budget.isArchived, true, "Budget should be archived");
    assert.strictEqual(archData.budget.isActive, false, "Archived budget should not be active");

    logPass("Archive: Successfully archived duplicate budget");

    // 11. Delete budget
    const delRes = await fetch(`${BASE_URL}/budgets/${duplicateBudgetId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(delRes.status, 200);

    logPass("Delete: Successfully deleted duplicate budget");

    // 12. Test PDF Export Engine
    const pdfRes = await fetch(`${BASE_URL}/trips/${tripId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(pdfRes.status, 200, "PDF export should return 200 OK");
    assert.strictEqual(pdfRes.headers.get("content-type"), "application/pdf", "PDF export content-type should be application/pdf");
    logPass("PDF: Successfully verified PDF export returns a valid PDF document");

    // Cleanup
    const deleteTripRes = await fetch(`${BASE_URL}/trips/${tripId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(deleteTripRes.status, 200);
    logPass("Teardown: Created test data cleanly deleted");

    console.log("\n\x1b[32m=== ALL MULTI-BUDGET AND SYNC TESTS PASSED SUCCESSFULLY ===\x1b[0m");

  } catch (error) {
    logFail("TestSuite execution", error);
    process.exit(1);
  }
}

runTests();
