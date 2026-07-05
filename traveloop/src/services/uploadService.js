import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Compresses an image file to a specified quality (0 to 1) using Canvas API.
 */
export const compressImage = (file, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      // Non-image files (e.g. PDFs) are not compressed
      return resolve(file);
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Downscale large images (max 1200px width/height)
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Canvas blob extraction failed."));
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Uploads a file (with optional compression for images) to Firebase Storage.
 * @param {File} file - Original file
 * @param {string} path - Storage path prefix (e.g. 'logos', 'profiles', 'documents')
 * @param {function} onProgress - Callback receiving upload percentage (0 - 100)
 */
export const uploadFileToFirebase = async (file, path, onProgress) => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }

  // 1. Perform image compression if it's an image
  let finalFile = file;
  try {
    if (file.type.startsWith("image/")) {
      console.log(`[Upload Service] Compressing image: ${file.name}`);
      finalFile = await compressImage(file, 0.75);
    }
  } catch (compressErr) {
    console.warn("[Upload Service] Image compression failed, uploading original file:", compressErr);
  }

  // 2. Setup storage ref
  const uniqueName = `${Date.now()}-${finalFile.name}`;
  const storageRef = ref(storage, `${path}/${uniqueName}`);

  // 3. Initiate resumable upload
  const uploadTask = uploadBytesResumable(storageRef, finalFile);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error("[Firebase Upload Error]:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[Upload Service] Upload completed. URL: ${downloadURL}`);
          resolve(downloadURL);
        } catch (urlErr) {
          reject(urlErr);
        }
      }
    );
  });
};

export default {
  compressImage,
  uploadFileToFirebase,
};
