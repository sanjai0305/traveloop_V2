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
