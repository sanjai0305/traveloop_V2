import express from "express";
import protect from "../middleware/authMiddleware.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";
import UploadService from "../services/uploadService.js";
import S3StorageService, { FILE_RULES } from "../services/storage/s3StorageService.js";
import db from "../config/db.js";

const router = express.Router();

/**
 * @route   GET /api/upload/health
 * @desc    Check S3 storage connectivity & health
 * @access  Public
 */
router.get("/health", async (req, res) => {
  try {
    const health = await S3StorageService.checkStorageHealth();
    return res.status(200).json({ success: true, storage: health });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/upload
 * @desc    Upload file buffer directly to AWS S3 (Backend-mediated)
 * @access  Private
 */
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
      const folder = req.body.folder || "general";
      const entityType = req.body.entityType || folder;
      const entityId = req.body.entityId || null;
      const visibility = req.body.visibility || null;
      const ownerId = req.user?.id || req.user?.userId || null;

      // Upload buffer to AWS S3
      const result = await UploadService.uploadFile(req.file, folder, {
        entityType,
        entityId,
        ownerId,
        visibility,
        metadata: {
          uploadedBy: req.user?.email || "authenticated_user",
        },
      });

      return res.status(200).json({
        success: true,
        url: result.url,
        secure_url: result.url, // Cloudinary backward compatibility
        public_id: result.objectKey, // Cloudinary backward compatibility
        objectKey: result.objectKey,
        fileId: result.fileId,
        bytes: result.bytes,
        format: result.format,
        filename: req.file.originalname,
        visibility: result.visibility,
      });
    } catch (uploadErr) {
      console.error("[AWS S3 Upload Failed]:", uploadErr);
      return res.status(500).json({
        success: false,
        message: uploadErr.message || "Failed to upload file to S3 storage.",
      });
    }
  });
});

/**
 * @route   POST /api/upload/presign
 * @desc    Generate a short-lived presigned URL for direct browser-to-S3 upload
 * @access  Private
 */
router.post("/presign", protect, async (req, res) => {
  try {
    const {
      filename,
      mimetype,
      size,
      folder = "general",
      entityType = "media",
      entityId = null,
      visibility = null,
    } = req.body;

    if (!filename || !mimetype) {
      return res.status(400).json({
        success: false,
        message: "Filename and mimetype are required to generate presigned upload URL.",
      });
    }

    // Validate mimetype against supported formats
    const isImage = FILE_RULES.ALLOWED_IMAGE_TYPES.includes(mimetype);
    const isDoc = FILE_RULES.ALLOWED_DOCUMENT_TYPES.includes(mimetype);
    const isAudio = FILE_RULES.ALLOWED_AUDIO_TYPES.includes(mimetype);

    if (!isImage && !isDoc && !isAudio) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${mimetype}. Allowed types: JPG, PNG, WEBP, PDF, DOCX, MP3.`,
      });
    }

    const ownerId = req.user?.id || req.user?.userId || null;

    const presignedData = await S3StorageService.getPresignedUploadUrl({
      folder,
      entityType,
      entityId,
      ownerId,
      filename,
      mimetype,
      size,
      visibility,
      expiresIn: 900, // 15 mins
    });

    return res.status(200).json({
      success: true,
      ...presignedData,
    });
  } catch (error) {
    console.error("[Presign Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate presigned upload URL.",
    });
  }
});

/**
 * @route   POST /api/upload/confirm
 * @desc    Confirm direct client upload and persist metadata in MySQL
 * @access  Private
 */
router.post("/confirm", protect, async (req, res) => {
  try {
    const {
      objectKey,
      originalFilename,
      mimetype,
      size,
      entityType = "media",
      entityId = null,
      visibility = null,
    } = req.body;

    if (!objectKey) {
      return res.status(400).json({
        success: false,
        message: "objectKey is required to confirm upload.",
      });
    }

    const ownerId = req.user?.id || req.user?.userId || null;

    const confirmed = await S3StorageService.confirmDirectUpload({
      objectKey,
      originalFilename,
      mimetype,
      size,
      entityType,
      entityId,
      ownerId,
      visibility,
      metadata: {
        confirmedBy: req.user?.email || "authenticated_user",
      },
    });

    return res.status(200).json({
      success: true,
      ...confirmed,
    });
  } catch (error) {
    console.error("[Confirm Upload Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm upload in S3.",
    });
  }
});

/**
 * @route   GET /api/upload/download/:fileId
 * @desc    Get authorized presigned download URL for private files
 * @access  Private
 */
router.get("/download/:fileId", protect, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const userRole = (req.user?.role || "").toUpperCase();

    const { data: fileRecord } = await db
      .from("uploaded_files")
      .select("*")
      .eq("id", fileId)
      .maybeSingle();

    if (!fileRecord) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    // If file is private, enforce owner or admin access
    if (fileRecord.visibility === "private") {
      const isOwner = fileRecord.owner_id === userId;
      const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You are not authorized to view this document.",
        });
      }
    }

    // Generate short-lived 1-hour presigned URL
    const downloadUrl = await S3StorageService.getPresignedDownloadUrl(
      fileRecord.object_key,
      3600
    );

    if (req.query.redirect === "true") {
      return res.redirect(downloadUrl);
    }

    return res.status(200).json({
      success: true,
      downloadUrl,
      filename: fileRecord.original_filename,
      mimetype: fileRecord.mime_type,
      size: fileRecord.file_size,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("[Download Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/upload/:fileId
 * @desc    Delete file from S3 and MySQL
 * @access  Private
 */
router.delete("/:fileId", protect, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const userRole = (req.user?.role || "").toUpperCase();

    const { data: fileRecord } = await db
      .from("uploaded_files")
      .select("*")
      .eq("id", fileId)
      .maybeSingle();

    if (!fileRecord) {
      return res.status(404).json({ success: false, message: "File record not found." });
    }

    const isOwner = fileRecord.owner_id === userId;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot delete files you do not own.",
      });
    }

    await S3StorageService.deleteFile(fileRecord.object_key, isOwner ? userId : null);

    return res.status(200).json({
      success: true,
      message: "File successfully deleted from S3 and database.",
    });
  } catch (error) {
    console.error("[Delete Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
