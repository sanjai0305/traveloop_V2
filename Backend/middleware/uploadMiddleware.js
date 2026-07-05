import multer from "multer";
import path from "path";

// Configure memory storage to store files temporarily in RAM as Buffers
const storage = multer.memoryStorage();

// File validator supporting images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  const isValidExt = allowedExtensions.test(ext);
  const isValidMime = (mimetype.startsWith("image/") || mimetype === "application/pdf") && allowedExtensions.test(mimetype.split("/")[1] || mimetype.split("/")[0]);

  if (isValidExt || isValidMime) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only JPG, JPEG, PNG, WEBP, and PDF are allowed."));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export default uploadMiddleware;
