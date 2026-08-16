import { prisma } from '../../lib/prisma';
import { documentQueue } from '../../lib/queue';

export class DocumentService {
  /**
   * Registers a NEW Document in the DB and enqueues a processing job
   */
  static async uploadDocument(data: {
    name: string;
    s3_key: string;
    fileSize: number;
    mimeType: string;
    companyId: string;
    userId: string;
  }) {
    // 1. Create the Document record in PostgreSQL
    // Notice how we connect to both company and user!
    const document = await prisma.document.create({
      data: {
        name: data.name,
        s3_key: data.s3_key,
        file_size: BigInt(data.fileSize),
        mime_type: data.mimeType,
        status: 'pending', // Tell the DB we've received it but haven't parsed it yet
        company: { connect: { id: data.companyId } },
        uploader: { connect: { id: data.userId } },
      },
    });

    // 2. Add a "Notice" to our "Sticky Note Corkboard" (BullMQ)
    await documentQueue.add('process_document', {
      documentId: document.id,
      companyId: data.companyId,
      filePath: data.s3_key, // Path to the file we just saved on disk
    });

    console.log(`✅ Document "${document.name}" created and queued! ID: ${document.id}`);

    return document;
  }

  /**
   * Fetches all documents for a specific company
   */
  static async getDocuments(companyId: string) {
    return prisma.document.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }
}
