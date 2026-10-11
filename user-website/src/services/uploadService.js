/**
 * Compress an image file using browser canvas
 * @param {File} file - Original image file
 * @param {number} quality - JPEG compression quality (0-1)
 * @param {number} maxWidth - Maximum image width in pixels
 */
export const compressImage = async (file, quality = 0.75, maxWidth = 1920) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file (with optional image compression) to AWS S3 via backend API.
 * Supports progress tracking and automatic retries.
 * 
 * @param {File} file - Original file (PDF or Image)
 * @param {string} folder - Target category/folder
 * @param {function} onProgress - Callback receiving progress percentage (0-100)
 * @param {number} retries - Number of retries on failure (default: 3)
 */
export const uploadFile = async (file, folder = "general", onProgress, retries = 3) => {
  let finalFile = file;

  // 1. Image compression (if it's an image)
  if (file.type && file.type.startsWith("image/")) {
    try {
      finalFile = await compressImage(file, 0.75);
    } catch (compressErr) {
      console.warn("[Upload Service] Image compression failed, uploading original:", compressErr);
    }
  }

  const performUpload = async () => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
      const host = import.meta.env.VITE_API_URL || "http://localhost:5000";

      xhr.open("POST", `${host}/api/upload`);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

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
      const result = await performUpload();
      return result;
    } catch (err) {
      console.warn(`[Upload Service] Attempt ${i} failed. Reason: ${err.message}`);
      if (i === retries) {
        throw new Error(`Upload failed after ${retries} attempts. Reason: ${err.message}`);
      }
      await new Promise((res) => setTimeout(res, i * 1000));
    }
  }
};

/**
 * Direct Browser-to-S3 Upload via Presigned URL
 * @param {File} file - File object
 * @param {string} folder - Target folder
 * @param {function} onProgress - Progress callback
 */
export const uploadDirectToS3 = async (file, folder = "general", onProgress) => {
  const host = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token") || localStorage.getItem("agentToken");

  // 1. Request presigned upload URL
  const presignRes = await fetch(`${host}/api/upload/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      filename: file.name,
      mimetype: file.type || "application/octet-stream",
      size: file.size,
      folder,
    }),
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok || !presignData.success) {
    throw new Error(presignData.message || "Failed to obtain upload authorization.");
  }

  // 2. Direct PUT upload to S3
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignData.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Direct S3 upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during direct S3 upload."));
    xhr.send(file);
  });

  // 3. Confirm upload with backend
  const confirmRes = await fetch(`${host}/api/upload/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      objectKey: presignData.objectKey,
      originalFilename: file.name,
      mimetype: file.type || "application/octet-stream",
      size: file.size,
      folder,
    }),
  });

  const confirmData = await confirmRes.json();
  if (!confirmRes.ok || !confirmData.success) {
    throw new Error(confirmData.message || "Failed to confirm upload in backend.");
  }

  return confirmData;
};

export default {
  uploadFile,
  uploadDirectToS3,
  compressImage,
};
