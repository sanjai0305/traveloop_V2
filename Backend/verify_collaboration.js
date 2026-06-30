import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

const logPass = (name) => console.log(`\x1b[32m✓ [PASS] ${name}\x1b[0m`);
const logFail = (name, error) => console.error(`\x1b[31m✗ [FAIL] ${name}: ${error.message}\x1b[0m`);

async function runTests() {
  console.log("=== TRAVELOOP COLLABORATION & ROLE SECURITY TEST SUITE ===\n");

  const emailOwner = `owner_${Date.now()}@example.com`;
  const emailCollab = `collab_${Date.now()}@example.com`;
  const password = "Password123!";

  let tokenOwner = null;
  let tokenCollab = null;
  let tripId = null;
  let inviteNotificationId = null;

  try {
    // 1. Setup Users
    // Register & Login Owner
    const regOwnerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Trip",
        lastName: "Owner",
        email: emailOwner,
        password,
        phone: "1111111111",
        city: "Mumbai",
        country: "India",
      }),
    });
    const regOwnerData = await regOwnerRes.json();
    assert.strictEqual(regOwnerRes.status, 201, "Owner registration success");
    tokenOwner = regOwnerData.token;

    // Register & Login Collaborator
    const regCollabRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Trip",
        lastName: "Collaborator",
        email: emailCollab,
        password,
        phone: "2222222222",
        city: "Delhi",
        country: "India",
      }),
    });
    const regCollabData = await regCollabRes.json();
    assert.strictEqual(regCollabRes.status, 201, "Collaborator registration success");
    tokenCollab = regCollabData.token;
    logPass("Setup: Registered Owner & Collaborator accounts");

    // 2. Create Trip (Owner)
    const tripRes = await fetch(`${BASE_URL}/trips/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({
        title: "Collaborative Dream Trip",
        destination: "Paris, France",
        startDate: "2026-08-01",
        endDate: "2026-08-07",
        budget: 200000,
        destinationName: "Paris",
        placeId: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
        formattedAddress: "Paris, France",
        country: "France",
        latitude: 48.8566,
        longitude: 2.3522,
      }),
    });
    const tripData = await tripRes.json();
    assert.strictEqual(tripRes.status, 201, "Trip creation successful");
    tripId = tripData.trip._id;
    logPass("Trips: Created trip as Owner");

    // 3. Owner invites Collaborator as Viewer
    const inviteRes = await fetch(`${BASE_URL}/trips/${tripId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({
        email: emailCollab,
        role: "viewer",
      }),
    });
    const inviteData = await inviteRes.json();
    assert.strictEqual(inviteRes.status, 200, "Invitation sent");
    assert.strictEqual(inviteData.success, true);
    logPass("Collaboration: Owner invited Collaborator as 'viewer'");

    // 4. Collaborator checks notifications and accepts
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    const notifData = await notifRes.json();
    assert.strictEqual(notifRes.status, 200, "Get notifications list");
    const inviteNotif = notifData.notifications.find(
      (n) => n.isInvite && (n.trip?._id || n.trip)?.toString() === tripId.toString()
    );
    assert.ok(inviteNotif, "Invite notification exists");
    inviteNotificationId = inviteNotif._id;

    const acceptRes = await fetch(`${BASE_URL}/trips/invite/${inviteNotificationId}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCollab}`,
      },
    });
    const acceptData = await acceptRes.json();
    assert.strictEqual(acceptRes.status, 200, "Accepted invitation successfully");
    logPass("Collaboration: Collaborator accepted invite from notification drawer");

    // 5. Verify boundaries: Viewer trying to modify itinerary or notes (Expect 403 Forbidden)
    const addItineraryRes = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCollab}`, // Collaborator is currently viewer
      },
      body: JSON.stringify({
        trip: tripId,
        day: 1,
        time: "10:00 AM",
        title: "Louvre Museum Visit",
        category: "Sightseeing",
      }),
    });
    const addItineraryData = await addItineraryRes.json();
    assert.strictEqual(addItineraryRes.status, 403, "Viewer should be blocked from adding itinerary items");
    assert.strictEqual(addItineraryData.success, false);
    logPass("Security: Viewer write block on Itinerary verified");

    const addNoteRes = await fetch(`${BASE_URL}/notes/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCollab}`,
      },
      body: JSON.stringify({
        trip: tripId,
        title: "Secret spot",
        content: "Nice bakery around the corner",
      }),
    });
    const addNoteData = await addNoteRes.json();
    assert.strictEqual(addNoteRes.status, 403, "Viewer should be blocked from adding notes");
    assert.strictEqual(addNoteData.success, false);
    logPass("Security: Viewer write block on Notes verified");

    // 6. Owner updates Collaborator role to Editor
    const updateRoleRes = await fetch(`${BASE_URL}/trips/${tripId}/collaborators/${regCollabData.user._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({
        role: "editor",
      }),
    });
    const updateRoleData = await updateRoleRes.json();
    assert.strictEqual(updateRoleRes.status, 200, "Collaborator role updated to Editor");
    logPass("Collaboration: Owner promoted Collaborator to 'editor'");

    // 7. Collaborator (Editor) tries to add itinerary (Expect 200/201 Success)
    const editorItineraryRes = await fetch(`${BASE_URL}/itinerary/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCollab}`, // Collaborator is now editor
      },
      body: JSON.stringify({
        trip: tripId,
        day: 1,
        time: "10:00 AM",
        title: "Louvre Museum Visit",
        category: "Sightseeing",
      }),
    });
    const editorItineraryData = await editorItineraryRes.json();
    assert.strictEqual(editorItineraryRes.status, 201, "Editor should be allowed to add itinerary items");
    assert.strictEqual(editorItineraryData.success, true);
    logPass("Security: Editor write permission verified on Itinerary");

    // 8. Test Activity Logs
    const logRes = await fetch(`${BASE_URL}/trips/${tripId}/activity-log`, {
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    const logData = await logRes.json();
    assert.strictEqual(logRes.status, 200, "Activity log retrieval success");
    assert.ok(logData.logs.length > 0, "Should have activity logs recorded");
    logPass(`ActivityLogs: Verified logs generation (${logData.logs.length} logs found)`);

  } catch (err) {
    logFail("Collaboration & Security tests failed", err);
    process.exit(1);
  }

  console.log("\n===========================================");
  console.log("All collaboration security test cases passed! 🎉");
  console.log("===========================================\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
