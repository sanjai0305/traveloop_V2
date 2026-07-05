import axios from "axios";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "hf0hgprc";
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "traveloop_agents";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export const uploadCompanyLogo = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> => {
  console.log("[Cloudinary Upload] Uploading company logo:", file.name);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(percent);
          }
        },
      }
    );

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message || "Unknown Cloudinary error";
    console.error("[Cloudinary Logo Upload Error]:", errorMsg, error.response?.data);
    throw new Error(`Cloudinary Upload Failed: ${errorMsg}`);
  }
};

export const uploadAgentPhoto = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> => {
  console.log("[Cloudinary Upload] Uploading agent photo:", file.name);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(percent);
          }
        },
      }
    );

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message || "Unknown Cloudinary error";
    console.error("[Cloudinary Photo Upload Error]:", errorMsg, error.response?.data);
    throw new Error(`Cloudinary Upload Failed: ${errorMsg}`);
  }
};

/**
 * Validates file format and size.
 * Max size: 5 MB.
 * Allowed formats: jpg, jpeg, png, webp, avif.
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|avif)$/i;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|webp|avif)$/i;

  if (!allowedExtensions.test(file.name) || !allowedMimeTypes.test(file.type)) {
    return {
      valid: false,
      error: "Invalid file format. Only JPG, JPEG, PNG, WEBP, and AVIF are allowed.",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      valid: false,
      error: "File is too large. Maximum size is 5 MB.",
    };
  }

  return { valid: true };
};

/**
 * Uploads an image to Cloudinary.
 */
export const uploadImage = async (
  file: File,
  folder?: string,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(percent);
          }
        },
      }
    );
    return response.data.secure_url;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message || "Unknown Cloudinary error";
    console.error("[Cloudinary Image Upload Error]:", errorMsg);
    throw new Error(`Cloudinary Upload Failed: ${errorMsg}`);
  }
};

/**
 * Uploads multiple images using Promise.all.
 */
export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  return Promise.all(files.map((file) => uploadImage(file)));
};
