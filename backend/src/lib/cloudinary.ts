import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Log config status on startup (without leaking secrets)
console.log(`☁️ Cloudinary configured: cloud_name=${process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET'}, api_key=${process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET'}, api_secret=${process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET'}`);

/**
 * Uploads a local file to Cloudinary using upload_stream (buffer-based).
 * This avoids file-path permission issues on cloud platforms like Render.
 */
export async function uploadToCloudinary(localFilePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localFilePath);
  const originalName = path.basename(localFilePath);

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'intraai-documents',
        public_id: originalName,
        overwrite: true,
      },
      (error, result: UploadApiResponse | undefined) => {
        // Clean up local temp file regardless of outcome
        try {
          if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
        } catch (cleanupErr) {
          console.warn('⚠️ Could not clean up temp file:', cleanupErr);
        }

        if (error) {
          console.error('❌ Cloudinary upload_stream error:', JSON.stringify(error));
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary returned no result'));
        }
        console.log(`✅ Cloudinary upload success: ${result.secure_url}`);
        resolve(result.secure_url);
      }
    );

    // Write the buffer into the stream
    uploadStream.end(fileBuffer);
  });
}

export default cloudinary;
