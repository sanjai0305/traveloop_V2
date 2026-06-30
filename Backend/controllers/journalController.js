import Journal from "../models/Journal.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";

// Helper: verify trip access for V1.4 roles
const verifyTripAccess = async (tripId, userId, requiredPermission = "edit") => {
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

    const entries = await Journal.find({ trip: tripId }).sort({ day: 1 });
    res.status(200).json({ success: true, entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE journal entry
export const createJournalEntry = async (req, res) => {
  try {
    const { tripId, day, date, title, content, photos, mood, highlights } = req.body;

    const access = await verifyTripAccess(tripId, req.user.id, "edit");
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    const entry = await Journal.create({
      trip: tripId,
      day,
      date,
      title,
      content,
      photos: photos || [],
      mood: mood || "great",
      highlights: highlights || [],
    });

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} added journal entry for Day ${day}: "${title}"`);

    // Reward +3 XP and check Journal Keeper achievement
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

    res.status(201).json({ success: true, message: "Journal entry created", entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE journal entry
export const updateJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, photos, mood, highlights, date } = req.body;

    const entry = await Journal.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: "Journal entry not found" });

    const access = await verifyTripAccess(entry.trip, req.user.id, "edit");
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    if (title     !== undefined) entry.title      = title;
    if (content   !== undefined) entry.content    = content;
    if (photos    !== undefined) entry.photos     = photos;
    if (mood      !== undefined) entry.mood       = mood;
    if (highlights!== undefined) entry.highlights = highlights;
    if (date      !== undefined) entry.date       = date;

    await entry.save();

    const userName = req.user.firstName || req.user.email;
    await logActivity(entry.trip, req.user.id, `${userName} updated journal entry for Day ${entry.day}: "${title || entry.title}"`);

    res.status(200).json({ success: true, message: "Journal entry updated", entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE journal entry
export const deleteJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Journal.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: "Journal entry not found" });

    const access = await verifyTripAccess(entry.trip, req.user.id, "edit");
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    const userName = req.user.firstName || req.user.email;
    await logActivity(entry.trip, req.user.id, `${userName} deleted journal entry for Day ${entry.day}: "${entry.title}"`);

    await Journal.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Journal entry deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
