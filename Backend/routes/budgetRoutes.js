// routes/budgetRoutes.js
import express from "express";
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  archiveBudget,
  activateBudget,
  duplicateBudget,
  syncBudget
} from "../controllers/budgetController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createBudget);
// NOTE: static routes must come before /:tripId to avoid param conflicts
router.post("/sync/:tripId", protect, syncBudget);
router.get("/:tripId", protect, getBudgets);
router.put("/update/:id", protect, updateBudget);
router.delete("/:id", protect, deleteBudget);
router.patch("/archive/:id", protect, archiveBudget);
router.patch("/activate/:id", protect, activateBudget);
router.post("/duplicate/:id", protect, duplicateBudget);

export default router;
