import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log(localFilePath);
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    const optimizedUrl = cloudinary.url(response.public_id, {
      fetch_format: "auto",
      quality: "auto",
    });
    fs.unlinkSync(localFilePath);
    return optimizedUrl;
  } catch (error) {
    console.log(error);
    return null;
  }
};
export { uploadOnCloudinary };
