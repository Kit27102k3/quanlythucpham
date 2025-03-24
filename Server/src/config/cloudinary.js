import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load biến môi trường từ file .env
dotenv.config({ path: ".env" });

// Validate cấu hình
const requiredConfig = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

for (const key of requiredConfig) {
  if (!process.env[key]) {
    throw new Error(`Missing required Cloudinary config: ${key}`);
  }
}

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log("Cloudinary configured with:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: "***" + process.env.CLOUDINARY_API_KEY.slice(-4),
  api_secret: "***" + process.env.CLOUDINARY_API_SECRET.slice(-4),
});

export default cloudinary;
