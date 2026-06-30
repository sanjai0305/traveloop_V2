// routes/budgetRoutes.js
import express from "express";
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  archiveBudget,
  activateBudget,
  duplicateBudget
} from "../controllers/budgetController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createBudget);
router.get("/:tripId", protect, getBudgets);
router.put("/update/:id", protect, updateBudget);
router.delete("/:id", protect, deleteBudget);
router.patch("/archive/:id", protect, archiveBudget);
router.patch("/activate/:id", protect, activateBudget);
router.post("/duplicate/:id", protect, duplicateBudget);

export default router;
