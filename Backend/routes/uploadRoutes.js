import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

// Initialize Firebase Admin if not initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[Firebase Admin] Initialized in upload routes successfully.");
  } catch (err) {
    console.error("[Firebase Admin] Failed to initialize in upload routes:", err);
  }
}

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}_${uniqueSuffix}${ext}`);
  },
});

// File validator
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|avif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  console.log(`[Upload Filter] Validating file: ${file.originalname} (${mimetype})`);

  const isValidExt = allowedExtensions.test(ext);
  const isValidMime = mimetype.startsWith("image/") && allowedExtensions.test(mimetype.split("/")[1]);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only JPG, JPEG, PNG, WEBP, and AVIF are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

// Upload route endpoint
router.post("/", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("[Upload Error] Multer error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum size is 5 MB.",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      console.error("[Upload Error] Validation error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    console.log("[Upload Service] File uploaded locally:", req.file.path);

    // Try to upload to Firebase Storage
    const bucketName = "traveloop-version-2-83bd2.appspot.com";
    try {
      if (admin.apps.length) {
        console.log(`[Firebase Admin] Uploading to bucket: ${bucketName}...`);
        const bucket = admin.storage().bucket(bucketName);
        const destination = `trips/covers/${Date.now()}_${req.file.filename}`;
        
        await bucket.upload(req.file.path, {
          destination,
          metadata: {
            contentType: req.file.mimetype,
          },
        });

        // Try to make file public
        try {
          await bucket.file(destination).makePublic();
        } catch (pubErr) {
          console.warn("[Firebase Admin] Could not make file public (rules may apply):", pubErr.message);
        }

        const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destination)}?alt=media`;
        console.log("[Firebase Admin Upload Success] URL:", downloadURL);

        // Delete local temp file
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error("Failed to delete local temp file:", unlinkErr);
        }

        return res.status(200).json({
          success: true,
          url: downloadURL,
          filename: req.file.filename,
        });
      } else {
        throw new Error("Firebase Admin SDK not initialized.");
      }
    } catch (firebaseErr) {
      console.warn("[Firebase Admin Upload Failed] Falling back to local storage URL:", firebaseErr);
      
      // Fallback local serving
      const host = req.get("host");
      const protocol = req.protocol;
      const downloadURL = `${protocol}://${host}/uploads/${req.file.filename}`;
      
      return res.status(200).json({
        success: true,
        url: downloadURL,
        filename: req.file.filename,
      });
    }
  });
});

export default router;
