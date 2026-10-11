import S3StorageService from "./storage/s3StorageService.js";

/**
 * UploadService — Centralized Storage Façade backed by AWS S3.
 *
 * Provides high-level upload, presign, download, and deletion interfaces
 * for all application entities (avatars, KYC, gallery, chat, documents).
 */
export class UploadService {
  /**
   * Primary upload handler for Express Multer file objects or buffers
   * @param {Object} file - Express Multer file object ({ buffer, originalname, mimetype, size })
   * @param {string} folder - Target category/folder
   * @param {Object} options - Additional metadata (ownerId, entityId, visibility)
   */
  static async uploadFile(file, folder = "general", options = {}) {
    if (!file) throw new Error("No file provided for upload.");

    const buffer = file.buffer || file;
    const originalname = file.originalname || options.filename || "upload.bin";
    const mimetype = file.mimetype || options.mimetype || "application/octet-stream";
    const size = file.size || buffer.length || 0;

    const result = await S3StorageService.uploadFile({
      buffer,
      originalname,
      mimetype,
      size,
      folder,
      entityType: options.entityType || folder,
      entityId: options.entityId || null,
      ownerId: options.ownerId || null,
      visibility: options.visibility || null,
      metadata: options.metadata || {},
    });

    return {
      success: true,
      url: result.url,
      secure_url: result.url, // Cloudinary backward compatibility
      public_id: result.objectKey, // Cloudinary backward compatibility
      objectKey: result.objectKey,
      fileId: result.fileId,
      bytes: result.size,
      format: result.mimetype?.split("/")[1] || "bin",
      visibility: result.visibility,
    };
  }

  /**
   * Legacy Cloudinary compatibility bridge — routes directly to AWS S3
   * @param {Buffer} fileBuffer - Buffer from memoryStorage
   * @param {string} folder - Destination category
   */
  static async uploadToCloudinary(fileBuffer, folder = "traveloop") {
    console.log(`[UploadService] Routing legacy upload call to AWS S3 (folder: ${folder})...`);
    return this.uploadFile(
      {
        buffer: fileBuffer,
        originalname: `upload_${Date.now()}.jpg`,
        mimetype: "image/jpeg",
        size: fileBuffer.length,
      },
      folder
    );
  }

  /**
   * Delete asset from AWS S3
   * @param {string} objectKeyOrPublicId - S3 object key
   * @param {string} ownerId - Optional owner ID for access control
   */
  static async deleteFile(objectKeyOrPublicId, ownerId = null) {
    return S3StorageService.deleteFile(objectKeyOrPublicId, ownerId);
  }

  /**
   * Legacy Cloudinary compatibility bridge for deletion
   */
  static async deleteFromCloudinary(publicId) {
    if (!publicId) return;
    console.log(`[UploadService] Routing legacy delete call to AWS S3 (key: ${publicId})...`);
    return S3StorageService.deleteFile(publicId);
  }

  /**
   * Generate presigned URL for direct client-to-S3 upload
   */
  static async getPresignedUploadUrl(params) {
    return S3StorageService.getPresignedUploadUrl(params);
  }

  /**
   * Confirm direct client upload and persist in MySQL
   */
  static async confirmDirectUpload(params) {
    return S3StorageService.confirmDirectUpload(params);
  }

  /**
   * Generate presigned download URL for private files
   */
  static async getPresignedDownloadUrl(objectKey, expiresIn = 3600) {
    return S3StorageService.getPresignedDownloadUrl(objectKey, expiresIn);
  }
}

export default UploadService;
