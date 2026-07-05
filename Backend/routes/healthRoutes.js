import express from "express";
import { getSystemHealth } from "../controllers/healthController.js";

const router = express.Router();

router.get("/", getSystemHealth);

export default router;
