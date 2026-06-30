import express from "express";
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "../controllers/journalController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all entries for a trip
router.get("/:tripId", protect, getJournalEntries);

// CREATE entry
router.post("/", protect, createJournalEntry);

// UPDATE entry
router.put("/:id", protect, updateJournalEntry);

// DELETE entry
router.delete("/:id", protect, deleteJournalEntry);

export default router;
