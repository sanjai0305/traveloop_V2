import cloudinary from "../config/cloudinary.js";

export class UploadService {
  /**
   * Upload file buffer directly to Cloudinary using upload_stream.
   * @param {Buffer} fileBuffer - The file buffer from memoryStorage
   * @param {string} folder - Destination folder on Cloudinary
   */
  static uploadToCloudinary(fileBuffer, folder = "traveloop") {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto", // Automatically handle images, PDFs, etc.
        },
        (error, result) => {
          if (error) {
            console.error("[Cloudinary Stream Upload Error]:", error);
            return reject(error);
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
            format: result.format,
          });
        }
      );

      // Write file buffer directly into the stream
      uploadStream.end(fileBuffer);
    });
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
