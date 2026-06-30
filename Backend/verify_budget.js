import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

const logPass = (name) => console.log(`\x1b[32m✓ [PASS] ${name}\x1b[0m`);
const logFail = (name, error) => console.error(`\x1b[31m✗ [FAIL] ${name}: ${error.message}\x1b[0m`);

async function runTests() {
  console.log("=== TRAVELOOP BUDGET VALIDATION TEST SUITE ===\n");
  
  let token = null;
  let tripId = null;
  let item1Id = null; // 2000 item
  let item2Id = null; // 80000 item
  let item3Id = null; // 50000 item

  const testEmail = `budget_tester_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  try {
    // 1. Setup User
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Budget",
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
        title: "Budget Validation Trip",
        destination: "Swiss Alps",
        startDate: "2026-08-15",
        endDate: "2026-08-25",
        budget: 150000,
      }),
    });
    const tripData = await tripRes.json();
    assert.strictEqual(tripRes.status, 201, "Trip creation should succeed");
    tripId = tripData.trip._id;

    logPass("Setup: Created trip with Budget = ₹150,000");

    // 3. Test: Valid itinerary expense of 2000
    const itin1Res = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trip: tripId,
        day: 1,
        time: "10:00",
        title: "Sightseeing Tour",
        budget: 2000,
      }),
    });
    const itin1Data = await itin1Res.json();
    assert.strictEqual(itin1Res.status, 201, "Valid itinerary creation should return 201");
    assert.strictEqual(itin1Data.itinerary.budget, 2000);
    item1Id = itin1Data.itinerary._id;

    logPass("Itinerary: Expense ₹2,000 is Valid (Remaining ₹148,000)");

    // 4. Test: Invalid itinerary expense of 2000000 (exceeds total budget)
    const itin2Res = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trip: tripId,
        day: 1,
        time: "12:00",
        title: "Private Helicopter Ride",
        budget: 2000000,
      }),
    });
    const itin2Data = await itin2Res.json();
    assert.strictEqual(itin2Res.status, 400, "Exceeding total budget should return 400");
    assert.strictEqual(itin2Data.success, false);
    assert.strictEqual(itin2Data.message, "Trip budget exceeded.");

    logPass("Itinerary: Expense ₹2,000,000 is Invalid & rejected by backend (exceeds total budget)");

    // 5. Test: Add expenses of 80000 and 50000 (Total = 132000, Remaining = 18000)
    // Add 80000 item
    const itin3Res = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trip: tripId,
        day: 2,
        time: "09:00",
        title: "Hotel Booking",
        budget: 80000,
      }),
    });
    const itin3Data = await itin3Res.json();
    assert.strictEqual(itin3Res.status, 201);
    item2Id = itin3Data.itinerary._id;

    // Add 50000 item
    const itin4Res = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trip: tripId,
        day: 3,
        time: "09:00",
        title: "Train Pass",
        budget: 50000,
      }),
    });
    const itin4Data = await itin4Res.json();
    assert.strictEqual(itin4Res.status, 201);
    item3Id = itin4Data.itinerary._id;

    logPass("Itinerary: Combined expenses ₹80,000 + ₹50,000 are Valid (Total planned: ₹132,000, Remaining ₹18,000)");

    // 6. Test: Add expense of 30000 (exceeds remaining available budget of 18000)
    const itin5Res = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trip: tripId,
        day: 4,
        time: "10:00",
        title: "Ski Gear Rental",
        budget: 30000,
      }),
    });
    const itin5Data = await itin5Res.json();
    assert.strictEqual(itin5Res.status, 400, "Exceeding remaining budget should return 400");
    assert.strictEqual(itin5Data.message, "Trip budget exceeded.");

    logPass("Itinerary: Expense ₹30,000 is Invalid & rejected by backend (exceeds remaining available budget)");

    // 7. Test: Edit expense from 80000 to 10000 (becomes valid, total becomes 62000, remaining 88000)
    const editRes = await fetch(`${BASE_URL}/itinerary/${item2Id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        budget: 10000,
      }),
    });
    const editData = await editRes.json();
    assert.strictEqual(editRes.status, 200, "Editing expense down should succeed");
    assert.strictEqual(editData.itinerary.budget, 10000);

    logPass("Itinerary: Edited hotel booking expense from ₹80,000 → ₹10,000 (Total planned: ₹62,000, Remaining ₹88,000)");

    // 8. Test: The previously rejected 30000 expense should now be valid to add!
    const itin6Res = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trip: tripId,
        day: 4,
        time: "10:00",
        title: "Ski Gear Rental",
        budget: 30000,
      }),
    });
    const itin6Data = await itin6Res.json();
    assert.strictEqual(itin6Res.status, 201, "Previously invalid expense should succeed now");
    assert.strictEqual(itin6Data.itinerary.budget, 30000);

    logPass("Itinerary: Re-attempted ₹30,000 expense addition, now Valid & accepted");

    // 9. Test: Delete expense (deleting the 10000 one -> remaining budget updates, planned becomes 82000)
    const delItinRes = await fetch(`${BASE_URL}/itinerary/${item2Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(delItinRes.status, 200, "Deletion should return 200");

    logPass("Itinerary: Deleted ₹10,000 expense successfully");

    // 10. Test: Negative expense amount (rejected by backend)
    const itinNegRes = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trip: tripId,
        day: 5,
        time: "10:00",
        title: "Refund Test",
        budget: -500,
      }),
    });
    const itinNegData = await itinNegRes.json();
    assert.strictEqual(itinNegRes.status, 400, "Negative budget should return 400");
    assert.strictEqual(itinNegData.message, "Expense amount cannot be negative.");

    logPass("Itinerary: Negative expense amount ₹-500 is rejected by backend");

    // 11. Test: Expense API endpoints validation (addExpense)
    // Add valid expense of 5000 (valid)
    const expenseRes1 = await fetch(`${BASE_URL}/trips/${tripId}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        description: "Cab Fare",
        amount: 5000,
        currency: "INR",
        convertedAmount: 5000,
        paidBy: regData.user._id,
        paidByName: "Tester",
      }),
    });
    assert.strictEqual(expenseRes1.status, 201, "Valid expense item should return 201");
    
    logPass("Expenses: Added valid trip expense item of ₹5,000");

    // Add invalid expense of 2000000 (exceeds budget)
    const expenseRes2 = await fetch(`${BASE_URL}/trips/${tripId}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        description: "Luxury Yacht rental",
        amount: 2000000,
        currency: "INR",
        convertedAmount: 2000000,
        paidBy: regData.user._id,
        paidByName: "Tester",
      }),
    });
    const expenseData2 = await expenseRes2.json();
    assert.strictEqual(expenseRes2.status, 400, "Exceeding budget should return 400");
    assert.strictEqual(expenseData2.message, "Trip budget exceeded.");

    logPass("Expenses: Expense item of ₹2,000,000 is Invalid & rejected by backend");

    // Cleanup
    const deleteTripRes = await fetch(`${BASE_URL}/trips/${tripId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(deleteTripRes.status, 200);
    logPass("Teardown: Created test data cleanly deleted");

    console.log("\n\x1b[32m=== ALL BUDGET VALIDATION TESTS PASSED SUCCESSFULLY ===\x1b[0m");

  } catch (error) {
    logFail("TestSuite execution", error);
    process.exit(1);
  }
}

runTests();
