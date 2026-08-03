import Journal from "../models/Journal.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";

// Helper: verify trip access for V1.4 roles
const verifyTripAccess = async (tripId, userId, requiredPermission = "edit") => {
  if (!tripId) return { error: "Missing required tripId parameter", status: 400 };
  const trip = await Trip.findById(tripId);
  if (!trip) return { error: "Trip not found", status: 404 };

  // requiredPermission mapping: "edit" -> create/update/delete, "view" -> read
  const action = requiredPermission === "edit" ? "update" : "read";
  if (!hasTripPermission(trip, userId, action)) {
    return { error: "Forbidden: You do not have permission for this trip", status: 403 };
  }

  // Resolve role for compatibility
  const ownerId = (trip.owner?._id || trip.owner || trip.user)?.toString();
  const isOwner = ownerId === userId.toString();
  let role = "owner";
  if (!isOwner) {
    const collab = trip.collaborators?.find(
      (c) => c.userId && (c.userId._id || c.userId).toString() === userId.toString() && c.acceptedAt !== null
    );
    if (collab) {
      role = collab.role;
    }
  }

  return { trip, role };
};

// GET all journal entries for a trip
export const getJournalEntries = async (req, res) => {
  try {
    const { tripId } = req.params;
    const access = await verifyTripAccess(tripId, req.user.id, "view");
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    const entries = await Journal.find({ $or: [{ trip: tripId }, { tripId: tripId }] }).sort({ day: 1 });
    res.status(200).json({ success: true, entries });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch journal entries from database" });
  }
};

// CREATE journal entry
export const createJournalEntry = async (req, res) => {
  try {
    const { tripId, day, dayId, date, title, content, description, photos, mood, highlights, timestamp } = req.body;

    const targetTripId = tripId || req.body.trip;
    if (!targetTripId) {
      return res.status(400).json({ success: false, message: "Validation error: tripId is required" });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Validation error: Title is required" });
    }

    const access = await verifyTripAccess(targetTripId, req.user.id, "edit");
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    const entry = await Journal.create({
      tripId: targetTripId,
      trip: targetTripId,
      day: Number(day || dayId || 1),
      date: date || (timestamp ? new Date(timestamp) : new Date()),
      title: title.trim(),
      content: content || description || "",
      photos: Array.isArray(photos) ? photos : [],
      mood: mood || "great",
      highlights: Array.isArray(highlights) ? highlights : [],
    });

    const userName = req.user.firstName || req.user.email;
    await logActivity(targetTripId, req.user.id, `${userName} added journal entry for Day ${entry.day}: "${title}"`);

    // Reward +3 XP and check Journal Keeper achievement
    try {
      const userObj = await User.findById(req.user.id);
      if (userObj) {
        userObj.xp = (userObj.xp || 0) + 3;
        userObj.level = Math.floor(userObj.xp / 100) + 1;
        const today = new Date().toISOString().split("T")[0];
        userObj.lastActiveDate = today;
        if (!userObj.achievements.includes("Journal Keeper")) {
          userObj.achievements.push("Journal Keeper");
        }
        await userObj.save();
      }
    } catch (xpErr) {
      console.error("XP Reward Error:", xpErr);
    }

    res.status(201).json({ success: true, message: "Journal entry saved successfully.", entry });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save journal entry in database" });
  }
};

// UPDATE journal entry
export const updateJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, description, photos, mood, highlights, date } = req.body;

    const entry = await Journal.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: "Journal entry not found" });

    const targetTripId = entry.tripId || entry.trip;
    const access = await verifyTripAccess(targetTripId, req.user.id, "edit");
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    if (title       !== undefined) entry.title      = title.trim();
    if (content     !== undefined || description !== undefined) entry.content = content !== undefined ? content : description;
    if (photos      !== undefined) entry.photos     = Array.isArray(photos) ? photos : [];
    if (mood        !== undefined) entry.mood       = mood;
    if (highlights  !== undefined) entry.highlights = highlights;
    if (date        !== undefined) entry.date       = date;

    await entry.save();

    const userName = req.user.firstName || req.user.email;
    await logActivity(targetTripId, req.user.id, `${userName} updated journal entry for Day ${entry.day}: "${title || entry.title}"`);

    res.status(200).json({ success: true, message: "Journal entry updated successfully.", entry });
  } catch (error) {
    console.error("Error updating journal entry:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update journal entry" });
  }
};

// DELETE journal entry
export const deleteJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Journal.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: "Journal entry not found" });

    const targetTripId = entry.tripId || entry.trip;
    const access = await verifyTripAccess(targetTripId, req.user.id, "edit");
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    const userName = req.user.firstName || req.user.email;
    await logActivity(targetTripId, req.user.id, `${userName} deleted journal entry for Day ${entry.day}: "${entry.title}"`);

    await Journal.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Journal entry deleted successfully." });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete journal entry" });
  }
};
