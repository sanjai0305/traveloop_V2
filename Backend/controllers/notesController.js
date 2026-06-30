import Note from "../models/Note.js";
import Trip from "../models/Trip.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";

// CREATE NOTE
export const createNote = async (req, res) => {
  try {
    const { trip: tripId, title, content, day, pinned, tags, type } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit notes" });
    }

    const note = await Note.create({
      trip: tripId,
      title,
      content,
      day,
      pinned,
      tags,
      type,
    });

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} added note: "${title}"`);

    res.status(201).json({
      success: true,
      message: "Note Created",
      note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET NOTES
export const getNotes = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view notes" });
    }

    const notes = await Note.find({
      trip: tripId,
    }).sort({ pinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE NOTE
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, day, pinned, tags, type } = req.body;

    const noteItem = await Note.findById(id);
    if (!noteItem) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const trip = await Trip.findById(noteItem.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit notes" });
    }

    const note = await Note.findByIdAndUpdate(
      id,
      { title, content, day, pinned, tags, type },
      { new: true, runValidators: true }
    );

    const userName = req.user.firstName || req.user.email;
    await logActivity(noteItem.trip, req.user.id, `${userName} updated note: "${title || noteItem.title}"`);

    res.status(200).json({
      success: true,
      message: "Note Updated",
      note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE NOTE
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const noteItem = await Note.findById(id);
    if (!noteItem) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const trip = await Trip.findById(noteItem.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "delete")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit notes" });
    }

    const userName = req.user.firstName || req.user.email;
    await logActivity(noteItem.trip, req.user.id, `${userName} deleted note: "${noteItem.title}"`);

    await Note.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Note Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};