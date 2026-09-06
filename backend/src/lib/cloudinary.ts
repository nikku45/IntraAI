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
    let result;
    try {
      result = await cloudinary.uploader.upload(localFilePath, {
        resource_type: 'auto',
        folder: 'intraai-documents',
      });
    } catch (err: any) {
      if (err?.http_code === 403 || err?.message?.includes('403')) {
        console.warn('⚠️ Cloudinary 403 on auto, retrying with raw resource_type...');
        result = await cloudinary.uploader.upload(localFilePath, {
          resource_type: 'raw',
          folder: 'intraai-documents',
        });
      } else {
        throw err;
      }
    }

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
