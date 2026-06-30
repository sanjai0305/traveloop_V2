import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

const logPass = (name) => console.log(`\x1b[32m✓ [PASS] ${name}\x1b[0m`);
const logFail = (name, error) => console.error(`\x1b[31m✗ [FAIL] ${name}: ${error.message}\x1b[0m`);

async function runTests() {
  console.log("=== TRAVELOOP CHAT API TEST SUITE ===\n");

  const emailOwner = `owner_${Date.now()}@example.com`;
  const emailCollab = `collab_${Date.now()}@example.com`;
  const password = "Password123!";

  let tokenOwner = null;
  let tokenCollab = null;
  let tripId = null;
  let inviteNotificationId = null;
  let messageId = null;

  try {
    // 1. Setup Users
    const regOwnerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Chat",
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

    const regCollabRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Chat",
        lastName: "Collab",
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
        title: "Test Chat Trip",
        destination: "Swiss Alps",
        startDate: "2026-08-15",
        endDate: "2026-08-25",
        budget: 500000,
      }),
    });
    const tripData = await tripRes.json();
    assert.strictEqual(tripRes.status, 201);
    tripId = tripData.trip._id;
    logPass("Setup: Created trip for Owner");

    // 3. Send Invite to Collaborator
    const inviteRes = await fetch(`${BASE_URL}/trips/${tripId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({
        email: emailCollab,
        role: "editor",
      }),
    });
    const inviteData = await inviteRes.json();
    assert.strictEqual(inviteRes.status, 200);
    logPass("Setup: Invite sent to Collaborator");

    // 4. Fetch Collaborator's notifications to find invite ID
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    const notifData = await notifRes.json();
    const inviteNotif = notifData.notifications.find(n => n.isInvite && n.inviteStatus === "pending");
    assert.ok(inviteNotif, "Invite notification found");
    inviteNotificationId = inviteNotif._id;

    // 5. Accept Invite (Collaborator)
    const acceptRes = await fetch(`${BASE_URL}/trips/invite/${inviteNotificationId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    assert.strictEqual(acceptRes.status, 200);
    logPass("Setup: Invite accepted by Collaborator");

    // 6. Test send message (Owner)
    const sendRes = await fetch(`${BASE_URL}/chat/${tripId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({
        message: "Hello collaborators! Let's discuss Switzerland.",
        messageType: "text",
      }),
    });
    const sendData = await sendRes.json();
    assert.strictEqual(sendRes.status, 201);
    assert.strictEqual(sendData.message.message, "Hello collaborators! Let's discuss Switzerland.");
    messageId = sendData.message._id;
    logPass("Send Message: Owner sent a text message successfully");

    // 7. Verify Unread Counts in getTrips (Collaborator)
    const getTripsRes = await fetch(`${BASE_URL}/trips`, {
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    const getTripsData = await getTripsRes.json();
    const targetTrip = getTripsData.trips.find(t => t._id === tripId);
    assert.ok(targetTrip);
    assert.strictEqual(targetTrip.unreadCount, 1, "Unread count should be 1 for collaborator");
    logPass("Unread Counts: Collaborator has 1 unread message");

    // 8. Test Retrieve Messages (Collaborator)
    const getMessagesRes = await fetch(`${BASE_URL}/chat/${tripId}`, {
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    const getMessagesData = await getMessagesRes.json();
    assert.strictEqual(getMessagesRes.status, 200);
    assert.strictEqual(getMessagesData.messages.length, 1);
    logPass("Retrieve Messages: Collaborator successfully fetched chat history");

    // 9. Mark Seen (Collaborator)
    const seenRes = await fetch(`${BASE_URL}/chat/${tripId}/seen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    assert.strictEqual(seenRes.status, 200);
    logPass("Mark Seen: Collaborator marked trip chat as seen");

    // 10. Verify Unread Counts cleared (Collaborator)
    const getTripsRes2 = await fetch(`${BASE_URL}/trips`, {
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    const getTripsData2 = await getTripsRes2.json();
    const targetTrip2 = getTripsData2.trips.find(t => t._id === tripId);
    assert.strictEqual(targetTrip2.unreadCount, 0, "Unread count should be 0 after marking seen");
    logPass("Unread Counts: Collaborator unread count reset to 0");

    // 11. Reaction toggling
    const reactRes = await fetch(`${BASE_URL}/chat/message/${messageId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCollab}`,
      },
      body: JSON.stringify({ emoji: "👍" }),
    });
    const reactData = await reactRes.json();
    assert.strictEqual(reactRes.status, 200);
    assert.strictEqual(reactData.reactions.length, 1);
    assert.strictEqual(reactData.reactions[0].emoji, "👍");
    logPass("Reactions: Collaborator reacted to Owner's message");

    // 12. Edit message (Owner)
    const editRes = await fetch(`${BASE_URL}/chat/message/${messageId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({ message: "Hello! Let's discuss Swiss Alps trip details." }),
    });
    const editData = await editRes.json();
    assert.strictEqual(editRes.status, 200);
    assert.strictEqual(editData.message.message, "Hello! Let's discuss Swiss Alps trip details.");
    assert.ok(editData.message.editedAt);
    logPass("Edit Message: Owner successfully edited own message");

    // 13. Soft delete message (Owner)
    const deleteRes = await fetch(`${BASE_URL}/chat/message/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenOwner}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    logPass("Delete Message: Owner soft-deleted message successfully");

    // 14. Verify message soft-deleted in retrieval
    const getMessagesRes2 = await fetch(`${BASE_URL}/chat/${tripId}`, {
      headers: { Authorization: `Bearer ${tokenCollab}` },
    });
    const getMessagesData2 = await getMessagesRes2.json();
    assert.strictEqual(getMessagesData2.messages.length, 0, "Soft deleted message should not be returned in standard fetch");
    logPass("Delete Verification: Deleted message omitted from active messages list");

    console.log("\n\x1b[32m=== ALL CHAT BACKEND TESTS PASSED SUCCESSFULLY ===\x1b[0m");
  } catch (error) {
    logFail("TestSuite execution", error);
    process.exit(1);
  }
}

runTests();
