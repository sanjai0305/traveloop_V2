import express from "express";

import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../controllers/notesController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE NOTE
router.post(
  "/create",
  protect,
  createNote
);

// GET NOTES
router.get(
  "/:tripId",
  protect,
  getNotes
);

// UPDATE NOTE
router.put(
  "/:id",
  protect,
  updateNote
);

// DELETE NOTE
router.delete(
  "/:id",
  protect,
  deleteNote
);

export default router;