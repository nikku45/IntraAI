import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { DocumentService } from './document.service';

export class DocumentController {
  /**
   * Handle the POST /upload request
   */
  static async uploadDocument(req: AuthRequest, res: Response): Promise<Response> {
    try {
      // 1. Check if a file was even provided!
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // 2. Extract user info (from our Auth Middleware!)
      // Note: "!" tells TS we're SURE these exist (thanks to middleware)
      const userId = req.user!.userId;
      const companyId = req.user!.companyId;

      // 3. Hand it off to our Service to do the DB and Queue work
      const document = await DocumentService.uploadDocument({
        name: req.file.originalname,
        s3_key: req.file.filename, // Name of the file on disk (unique UUID)
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        companyId: companyId,
        userId: userId,
      });

      // 4. Return success!
      return res.status(201).json({
        message: 'Document uploaded successfully! Task queued for processing.',
        document: {
          id: document.id,
          name: document.name,
          status: document.status,
        },
      });
    } catch (error) {
      console.error("❌ Document upload error:", error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  /**
   * Handle the GET / request to list documents
   */
  static async getDocuments(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const companyId = req.user!.companyId;
      const documents = await DocumentService.getDocuments(companyId);

      // Convert BigInt to Number/String for JSON serialization if necessary
      // Prisma BigInt needs to be handled
      const formattedDocs = documents.map(doc => ({
        ...doc,
        file_size: doc.file_size.toString()
      }));

      return res.status(200).json(formattedDocs);
    } catch (error) {
      console.error("❌ Get documents error:", error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
