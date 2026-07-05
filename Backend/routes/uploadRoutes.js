import express from "express";
import protect from "../middleware/authMiddleware.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";
import UploadService from "../services/uploadService.js";

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload file buffer directly to Cloudinary using upload_stream
// @access  Private
router.post("/", protect, (req, res) => {
  uploadMiddleware.single("file")(req, res, async (err) => {
    if (err) {
      console.error("[Upload Error] Multer / validation failure:", err.message);
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process upload request.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    try {
      const folderName = req.body.folder || "traveloop";
      
      // Upload the buffer to Cloudinary via stream
      const result = await UploadService.uploadToCloudinary(req.file.buffer, folderName);

      return res.status(200).json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        bytes: result.bytes,
        format: result.format,
        filename: req.file.originalname,
      });
    } catch (uploadErr) {
      console.error("[Cloudinary Stream Upload Failed]:", uploadErr);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to Cloudinary storage stream.",
      });
    }
  });
});

export default router;
