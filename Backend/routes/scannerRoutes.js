import express from "express";
import { scanReceipt } from "../controllers/expenseScannerController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/scanner/receipt
// Body: { imageBase64: string, mimeType: string, tripId: string }
// Note: base64 avoids needing a multipart form / disk write for multer on stateless servers
router.post("/receipt", protect, scanReceipt);

export default router;
