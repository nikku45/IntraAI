import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { prisma } from './prisma';
import { splitText } from './splitter';

const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads');

export const worker = new Worker(
  'document_processing',
  async (job: Job) => {
    const { documentId, companyId, filePath } = job.data;
    console.log(` Processing document: ${documentId} (Job: ${job.id})`);

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'processing' }
      });

      let fileBuffer: Buffer;
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        console.log(`🌐 Fetching file from Cloudinary URL: ${filePath}`);
        const response = await axios.get(filePath, { responseType: 'arraybuffer' });
        fileBuffer = Buffer.from(response.data);
      } else {
        const fullPath = path.resolve(UPLOADS_DIR, filePath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found at path: ${fullPath}`);
        }
        fileBuffer = fs.readFileSync(fullPath);
      }

      let rawText = '';
      const lowerFilePath = filePath.toLowerCase();
      if (lowerFilePath.endsWith('.pdf')) {
        const data = await pdf(fileBuffer);
        rawText = data.text;
      } else if (lowerFilePath.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        rawText = result.value;
      } else {
        rawText = fileBuffer.toString();
      }

      rawText = rawText.replace(/\0/g, '');

      const chunks = splitText(rawText, 1000, 200);

      await axios.post(`${AI_SERVICE_URL}/index`, {
        document_id: documentId,
        company_id: companyId,
        chunks: chunks
      });

      const chunkRecords = chunks.map((chunk, index) => ({
        document_id: documentId,
        company_id: companyId,
        chunk_index: index,
        chunk_text: chunk,
        token_count: Math.ceil(chunk.length / 4),
        vector_id: `${documentId}_${index}`
      }));

      await prisma.documentChunk.createMany({
        data: chunkRecords
      });

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'indexed',
          chunk_count: chunks.length
        }
      });

      console.log(`🚀 Successfully indexed ${chunks.length} chunks for document ${documentId}`);

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error processing document ${documentId}:`, error);

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'failed',
          error_message: errorMessage.replace(/\0/g, '')
        }
      });

      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});

console.log("🚀 Embedded Background Worker initialized inside Backend API!");
