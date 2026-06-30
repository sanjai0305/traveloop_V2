export const hasTripPermission = (trip, userId, action) => {
  const userIdStr = userId?.toString();
  if (!trip || !userIdStr) {
    console.log(`[Trip Permission Check] Denied - Missing trip or userId (Action: ${action})`);
    return false;
  }

  console.log(`[Trip Permission Check] Checking userId: ${userIdStr} for trip: ${trip._id} (Action: ${action})`);
  console.log(`[Trip Permission Check] Trip owner field: ${trip.owner?._id || trip.owner} / user field: ${trip.user}`);
  console.log(`[Trip Permission Check] Collaborators:`, JSON.stringify(trip.collaborators));

  const ownerId = (trip.owner?._id || trip.owner || trip.user)?.toString();
  const isOwner = ownerId === userIdStr;

  if (isOwner) {
    console.log(`[Trip Permission Check] [Owner Access] Allowed - User ${userIdStr} is Owner (Action: ${action})`);
    return true;
  }

  // Find accepted collaborator
  const collab = trip.collaborators?.find(
    (c) => c.userId && (c.userId._id || c.userId).toString() === userIdStr && c.acceptedAt !== null
  );

  if (!collab) {
    console.log(`[Trip Permission Check] [Viewer Block] Denied - User ${userIdStr} is not Owner or accepted collaborator (Action: ${action})`);
    return false;
  }

  const role = collab.role; // "editor" or "viewer"

  if (action === "read" || action === "view") {
    console.log(`[Trip Permission Check] [${role === "editor" ? "Editor Access" : "Viewer Access"}] Allowed - User ${userIdStr} has role ${role} (Action: ${action})`);
    return true;
  }

  if (role === "editor") {
    if (action === "delete_trip") {
      console.log(`[Trip Permission Check] [Viewer Block] Denied - Editor ${userIdStr} cannot delete the trip itself (Action: ${action})`);
      return false;
    }
    console.log(`[Trip Permission Check] [Editor Access] Allowed - User ${userIdStr} has role editor (Action: ${action})`);
    return true;
  }

  console.log(`[Trip Permission Check] [Viewer Block] Denied - User ${userIdStr} has role viewer (Action: ${action})`);
  return false;
};
