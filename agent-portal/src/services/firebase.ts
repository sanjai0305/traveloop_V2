import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app, storage } from "../../../traveloop/src/services/firebase";

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
 * Uploads an image file to Firebase Storage (with progress tracking).
 * If Firebase Storage fails or is offline, falls back to Express local backend file upload.
 */
export const uploadImage = async (
  file: File,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<string> => {
  console.log("[Upload Service] Processing file:", file.name, "Size:", file.size, "Type:", file.type);
  console.log(file);

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    console.error("[Upload Service] Validation failed:", validation.error);
    throw new Error(validation.error);
  }

  // Helper to upload to local Express backend as fallback
  const uploadToBackendFallback = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.warn("[Upload Service] Firebase Storage unavailable/denied. Falling back to Express server...");

      const xhr = new XMLHttpRequest();
      const apiUrl = import.meta.env.VITE_API_URL || "https://traveloopv2.duckdns.org";

      xhr.open("POST", `${apiUrl}/api/upload`);

      // Monitor upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          console.log(`[Backend Upload Progress] ${percent}%`);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && response.success && response.url) {
            console.log("[Backend Upload Success] URL returned:", response.url);
            console.log(response.url);
            console.log("SUCCESS");
            resolve(response.url);
          } else {
            reject(new Error(response.message || "Failed to upload to backend server."));
          }
        } catch (e) {
          reject(new Error("Failed to parse backend upload response."));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during fallback backend upload."));
      };

      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  };

  // Try Firebase Storage first
  try {
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const storageRef = ref(storage, `${folder}/${filename}`);

    console.log(`[Firebase Upload] Initiating upload for ${file.name} to ${folder}...`);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log(`[Firebase Upload Progress] ${percent}%`);
          if (onProgress) {
            onProgress(percent);
          }
        },
        async (error) => {
          console.error("[Firebase Upload Failed] Error code:", error.code, error.message);
          console.log("FAILED");

          // Firebase failed, attempt Express Backend fallback
          try {
            const fallbackUrl = await uploadToBackendFallback();
            resolve(fallbackUrl);
          } catch (fallbackError: any) {
            reject(fallbackError);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("[Firebase Upload Success] URL returned:", downloadUrl);
            console.log(downloadUrl);
            console.log("SUCCESS");
            resolve(downloadUrl);
          } catch (urlError) {
            // If getDownloadURL fails, fallback as well
            try {
              const fallbackUrl = await uploadToBackendFallback();
              resolve(fallbackUrl);
            } catch (fallbackError: any) {
              reject(fallbackError);
            }
          }
        }
      );
    });
  } catch (error) {
    console.error("[Firebase Initialization Error] Fallback triggered directly:", error);
    return uploadToBackendFallback();
  }
};

export { app, storage };
