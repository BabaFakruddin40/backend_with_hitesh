import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from "dotenv";

dotenv.config({ path: './.env' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// console.log("Cloud Name Loaded:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API Key Loaded:", process.env.CLOUDINARY_API_KEY ? "YES" : "NO");

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if (!localFilePath) return null;
       const result = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });
        console.log("file uploaded successfully on cloudinary", result.url);
        return result;
    } catch (error) {
    console.error("Cloudinary upload failed:", error); // 👈 Log error to diagnose

    // Delete local temp file on failure so it doesn't pile up
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

// cloudinary.v2.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png");

export { cloudinary, uploadOnCloudinary };