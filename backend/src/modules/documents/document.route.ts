import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { upload } from '../../lib/multer';
import { DocumentController } from './document.controller';

const router = Router();

/**
 * Route: POST /api/v1/documents/upload
 * 1. authenticate: Check if the user is logged in
 * 2. upload.single('file'): Receives the file with the key "file" (multipart/form-data)
 * 3. DocumentController.uploadDocument: Our logic to save in DB and Queue
 */
router.post('/upload', authenticate, upload.single('file'), DocumentController.uploadDocument);
router.get('/', authenticate, DocumentController.getDocuments);

export default router;
