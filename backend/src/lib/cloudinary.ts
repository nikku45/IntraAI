import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary as a raw resource (PDF, DOCX, TXT)
 * and returns the secure HTTPS URL.
 */
export async function uploadToCloudinary(localFilePath: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'raw',
      folder: 'intraai-documents',
    });

    // Clean up local temp file after successful upload to Cloudinary
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw error;
  }
}

export default cloudinary;
