import express from "express";
import {
  createChecklistItem,
  getChecklist,
  updateChecklistItem,
  deleteChecklistItem,
  resetChecklist,
  generatePackingList,
  bulkCreateChecklist,
} from "../controllers/checklistController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GENERATE AI PACKING SUGGESTIONS
router.post("/generate", protect, generatePackingList);

// BULK CREATE CHECKLIST ITEMS
router.post("/bulk", protect, bulkCreateChecklist);

// CREATE CHECKLIST ITEM
router.post("/create", protect, createChecklistItem);

// GET CHECKLIST
router.get("/:tripId", protect, getChecklist);

// RESET CHECKLIST
router.put("/reset/:tripId", protect, resetChecklist);

// UPDATE CHECKLIST ITEM
router.put("/:id", protect, updateChecklistItem);

// DELETE CHECKLIST ITEM
router.delete("/:id", protect, deleteChecklistItem);

export default router;