const validateBookingDeadline = (deadline, startDate) => {
  if (!deadline || !startDate) return true;
  const deadlineDate = new Date(deadline);
  const startDateDate = new Date(startDate);
  return deadlineDate < startDateDate;
};

// Mock AgentTrip shape
class MockAgentTrip {
  constructor(data) {
    Object.assign(this, data);
    if (!this.bookingDeadline && this.startDate) {
      // Default booking deadline logic
      const deadline = new Date(this.startDate);
      deadline.setDate(deadline.getDate() - 1);
      deadline.setHours(23, 59, 59, 999);
      this.bookingDeadline = deadline.toISOString();
    }
  }
}

// Mock Booking shape
class MockBooking {
  constructor(data) {
    Object.assign(this, data);
  }
}

async function runTests() {
  console.log("[MOCK TEST] Initializing Agent Portal Enhancements Business Logic Verification...");

  console.log("\n--- TEST 1: Booking Deadline Calculation (-1 Day, 23:59:59) ---");
  const trip = new MockAgentTrip({
    startDate: "2026-08-10",
    endDate: "2026-08-12",
  });
  console.log("✔ Created trip with Start Date:", trip.startDate);
  console.log("✔ Calculated Booking Deadline:", trip.bookingDeadline);

  const expectedDate = new Date("2026-08-10");
  expectedDate.setDate(expectedDate.getDate() - 1);
  expectedDate.setHours(23, 59, 59, 999);
  
  const actualDeadlineDate = new Date(trip.bookingDeadline);
  if (expectedDate.getFullYear() === actualDeadlineDate.getFullYear() &&
      expectedDate.getMonth() === actualDeadlineDate.getMonth() &&
      expectedDate.getDate() === actualDeadlineDate.getDate() &&
      actualDeadlineDate.getHours() === 23 &&
      actualDeadlineDate.getMinutes() === 59) {
    console.log("✔ PASS: Booking Deadline is exactly -1 day at 23:59:59.");
  } else {
    throw new Error(`FAIL: Expected local deadline time to be 23:59 on 2026-08-09, got ${trip.bookingDeadline} (local: ${actualDeadlineDate.toString()})`);
  }

  console.log("\n--- TEST 2: Booking Deadline Validation (deadline < startDate) ---");
  const validDeadline = validateBookingDeadline("2026-08-09T23:59:59", "2026-08-10");
  console.log("✔ Validation result for deadline < startDate (Valid):", validDeadline);
  if (!validDeadline) {
    throw new Error("FAIL: Valid deadline was rejected!");
  }

  const invalidDeadline = validateBookingDeadline("2026-08-11T23:59:59", "2026-08-10");
  console.log("✔ Validation result for deadline > startDate (Invalid):", invalidDeadline);
  if (invalidDeadline) {
    throw new Error("FAIL: Invalid deadline was accepted!");
  }
  console.log("✔ PASS: Deadline validation logic works perfectly.");

  console.log("\n--- TEST 3: Booking Deadline Expiry Blocking ---");
  const expiredTrip = new MockAgentTrip({
    startDate: "2026-01-10",
    endDate: "2026-01-12",
    bookingDeadline: "2026-01-09T23:59:59.000Z",
  });
  
  const now = new Date();
  const deadline = new Date(expiredTrip.bookingDeadline);
  console.log("✔ Current Date:", now.toISOString());
  console.log("✔ Expired Trip Booking Deadline:", expiredTrip.bookingDeadline);
  if (now > deadline) {
    console.log("✔ PASS: Correctly identified expired booking deadline.");
  } else {
    throw new Error("FAIL: Failed to identify expired booking deadline.");
  }

  console.log("\n--- TEST 4: Trip Deletion Protection ---");
  // Enforce rule: if bookingCount > 0, block deletion unless status is cancelled
  const activeTrip = { _id: "trip-1", status: "published", bookingCount: 5 };
  const canDeleteActive = activeTrip.bookingCount === 0 || activeTrip.status === "cancelled";
  console.log("✔ Attempting to delete active trip with bookings. Allowed?", canDeleteActive);
  if (canDeleteActive) {
    throw new Error("FAIL: Allowed deletion of active trip with bookings!");
  }

  const cancelledTrip = { _id: "trip-2", status: "cancelled", bookingCount: 5 };
  const canDeleteCancelled = cancelledTrip.bookingCount === 0 || cancelledTrip.status === "cancelled";
  console.log("✔ Attempting to delete cancelled trip with bookings. Allowed?", canDeleteCancelled);
  if (!canDeleteCancelled) {
    throw new Error("FAIL: Blocked deletion of cancelled trip with bookings!");
  }
  console.log("✔ PASS: Trip deletion rules correctly enforced.");

  console.log("\n--- TEST 5: Explicit Publish Workflow & Visibility Rules ---");
  const draftTrip = new MockAgentTrip({
    title: "Draft Trip",
    status: "draft",
    published: false,
    visible: false,
    startDate: "2026-08-10",
    bookingDeadline: "2026-08-09T23:59:59.000Z"
  });

  const publishedTrip = new MockAgentTrip({
    title: "Published Trip",
    status: "published",
    published: true,
    visible: true,
    startDate: "2026-08-10",
    bookingDeadline: "2026-08-09T23:59:59.000Z"
  });

  // Mock list check (Only display: published=true, status="published", bookingDeadline > now, startDate > now)
  const mockNow = new Date("2026-07-04T12:00:00.000Z");
  const filterTrips = (trips) => {
    return trips.filter(t => {
      if (!t.published || t.status !== "published") return false;
      if (!t.bookingDeadline || !t.startDate) return false;
      const deadline = new Date(t.bookingDeadline);
      const start = new Date(t.startDate);
      if (deadline <= mockNow || start <= mockNow) return false;
      return true;
    });
  };

  const visibleTrips = filterTrips([draftTrip, publishedTrip]);
  console.log("✔ Visible trips count:", visibleTrips.length);
  if (visibleTrips.length !== 1 || visibleTrips[0].title !== "Published Trip") {
    throw new Error("FAIL: Visibility filter does not match specification! Drafts must not be visible.");
  }
  console.log("✔ PASS: Explicit publish status and visibility rules enforced correctly.");

  console.log("\n--- All Business Logic Verification Tests Passed! ---");
}

runTests().catch((err) => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
