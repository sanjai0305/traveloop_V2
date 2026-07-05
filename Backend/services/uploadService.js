import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export class UploadService {
  /**
   * Upload local file path directly to Cloudinary.
   * @param {string} localFilePath - Path to local file (e.g. from multer)
   * @param {string} folder - Destination folder on Cloudinary
   */
  static async uploadToCloudinary(localFilePath, folder = "traveloop") {
    try {
      console.log(`[Cloudinary Service] Uploading file: ${localFilePath} to folder: ${folder}...`);
      const response = await cloudinary.uploader.upload(localFilePath, {
        folder: folder,
        resource_type: "auto", // Automatically detect PDF, image, etc.
      });

      // Delete local temporary file
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkErr) {
        console.warn("[Cloudinary Service] Local temp file cleanup failed:", unlinkErr.message);
      }

      return {
        secure_url: response.secure_url,
        public_id: response.public_id,
      };
    } catch (error) {
      console.error("[Cloudinary Service Error]:", error);
      // Ensure local temp file cleanup on error
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (e) {}
      throw error;
    }
  }

  /**
   * Delete asset from Cloudinary.
   * @param {string} publicId - Cloudinary asset public ID
   */
  static async deleteFromCloudinary(publicId) {
    if (!publicId) return;
    try {
      console.log(`[Cloudinary Service] Deleting asset: ${publicId}...`);
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`[Cloudinary Service] Delete response result:`, result);
      return result;
    } catch (error) {
      console.error(`[Cloudinary Service Delete Error] PublicId: ${publicId}. Reason:`, error.message);
    }
  }
}

export default UploadService;
