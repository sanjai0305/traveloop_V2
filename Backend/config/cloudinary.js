import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dkgb517lh",
  api_key: process.env.CLOUDINARY_API_KEY || "895475264389652",
  api_secret: process.env.CLOUDINARY_API_SECRET || "xyz_dummy_api_secret",
});

console.log("[Cloudinary Config] Initialized successfully.");

export default cloudinary;
