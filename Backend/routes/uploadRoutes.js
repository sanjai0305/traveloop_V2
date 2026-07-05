import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import protect from "../middleware/authMiddleware.js";
import UploadService from "../services/uploadService.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}_${uniqueSuffix}${ext}`);
  },
});

// File validator (Supports PDF and images)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  console.log(`[Upload Filter] Validating file: ${file.originalname} (${mimetype})`);

  const isValidExt = allowedExtensions.test(ext);
  const isValidMime = (mimetype.startsWith("image/") || mimetype === "application/pdf") && allowedExtensions.test(mimetype.split("/")[1] || mimetype.split("/")[0]);

  if (isValidExt || isValidMime) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only JPG, JPEG, PNG, WEBP, and PDF are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

// @route   POST /api/upload
// @desc    Upload file to Cloudinary
// @access  Private
router.post("/", protect, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("[Upload Error] Multer error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum size is 10 MB.",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      console.error("[Upload Error] Validation error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    try {
      const folderName = req.body.folder || "traveloop";
      const result = await UploadService.uploadToCloudinary(req.file.path, folderName);

      return res.status(200).json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        filename: req.file.filename,
      });
    } catch (uploadErr) {
      console.error("[Cloudinary Upload Failed]:", uploadErr);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to Cloudinary storage.",
      });
    }
  });
});

export default router;
