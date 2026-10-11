import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface S3UploadResult {
  url: string;
  publicId: string;
  objectKey?: string;
  fileId?: string;
}

// Backward-compatibility alias
export type CloudinaryUploadResult = S3UploadResult;

/**
 * Validates file format and size.
 * Max size: 15 MB.
 * Allowed formats: jpg, jpeg, png, webp, avif, pdf.
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|avif|pdf)$/i;
  const allowedMimeTypes = /^(image\/(jpeg|jpg|png|webp|avif)|application\/pdf)$/i;

  if (!allowedExtensions.test(file.name) || !allowedMimeTypes.test(file.type)) {
    return {
      valid: false,
      error: "Invalid file format. Allowed formats: JPG, JPEG, PNG, WEBP, AVIF, and PDF.",
    };
  }

  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: "File is too large. Maximum size is 15 MB.",
    };
  }

  return { valid: true };
};

/**
 * Uploads a file to AWS S3 via backend API.
 */
export const uploadToS3 = async (
  file: File,
  folder: string = "general",
  onProgress?: (percent: number) => void
): Promise<S3UploadResult> => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const token = localStorage.getItem("agentToken") || localStorage.getItem("token");

  try {
    const response = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(percent);
        }
      },
    });

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || "Failed to upload file to storage.");
    }

    return {
      url: data.url || data.secure_url,
      publicId: data.objectKey || data.public_id || data.url,
      objectKey: data.objectKey,
      fileId: data.fileId,
    };
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      "Failed to upload file to AWS S3 storage.";
    console.error("[AWS S3 Upload Error]:", errorMsg, error.response?.data);
    throw new Error(`Upload Failed: ${errorMsg}`);
  }
};

/**
 * Upload company logo to S3
 */
export const uploadCompanyLogo = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<S3UploadResult> => {
  console.log("[S3 Storage] Uploading company logo:", file.name);
  return uploadToS3(file, "logos", onProgress);
};

/**
 * Upload agent photo to S3
 */
export const uploadAgentPhoto = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<S3UploadResult> => {
  console.log("[S3 Storage] Uploading agent photo:", file.name);
  return uploadToS3(file, "profiles", onProgress);
};

/**
 * Upload single image to S3 (returns URL string)
 */
export const uploadImage = async (
  file: File,
  folder?: string,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const result = await uploadToS3(file, folder || "gallery", onProgress);
  return result.url;
};

/**
 * Upload multiple images using Promise.all
 */
export const uploadMultipleImages = async (files: File[], folder?: string): Promise<string[]> => {
  return Promise.all(files.map((file) => uploadImage(file, folder)));
};

export default {
  uploadToS3,
  uploadCompanyLogo,
  uploadAgentPhoto,
  uploadImage,
  uploadMultipleImages,
  validateImageFile,
};
