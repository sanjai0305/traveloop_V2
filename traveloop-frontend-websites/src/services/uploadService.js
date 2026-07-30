import { compressImage } from "./uploadService.js";

/**
 * Uploads a file (with optional image compression) directly to our Cloudinary-backed backend API endpoint.
 * Supports progress tracking and request retries.
 * 
 * @param {File} file - Original file (PDF or Image)
 * @param {string} folder - Folder name on Cloudinary
 * @param {function} onProgress - Callback receiving progress percentage (0-100)
 * @param {number} retries - Number of retries on failure (default: 3)
 */
export const uploadFile = async (file, folder = "traveloop", onProgress, retries = 3) => {
  let finalFile = file;

  // 1. Image compression (if it's an image)
  if (file.type.startsWith("image/")) {
    try {
      console.log(`[Upload Service] Compressing image file: ${file.name}`);
      finalFile = await compressImage(file, 0.75);
    } catch (compressErr) {
      console.warn("[Upload Service] Image compression failed, uploading original:", compressErr);
    }
  }

  const performUpload = async (attempt) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
      const host = import.meta.env.VITE_API_URL || "http://localhost:5000";

      xhr.open("POST", `${host}/api/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      // Progress Tracker
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.message || "Upload failed."));
            }
          } catch (e) {
            reject(new Error("Failed to parse upload server response."));
          }
        } else {
          reject(new Error(`Server returned status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network connection error."));
      };

      const formData = new FormData();
      formData.append("file", finalFile);
      formData.append("folder", folder);

      xhr.send(formData);
    });
  };

  // 2. Execute upload request with automated retry strategy
  for (let i = 1; i <= retries; i++) {
    try {
      const result = await performUpload(i);
      return result;
    } catch (err) {
      console.warn(`[Upload Service] Attempt ${i} failed. Reason: ${err.message}`);
      if (i === retries) {
        throw new Error(`Upload failed after ${retries} attempts. Reason: ${err.message}`);
      }
      // Linear delay backoff before retry (1s, 2s, etc.)
      await new Promise((res) => setTimeout(res, i * 1000));
    }
  }
};

export default {
  uploadFile,
};
export { compressImage } from "./uploadService.js";
