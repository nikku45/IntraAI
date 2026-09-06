import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { prisma } from './prisma';
import { splitText } from './splitter';

// 1. Initialize our tools
const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../backend/uploads');

/**
 * The Worker - This runs and waits for jobs to appear in the "document_processing" queue.
 */
const worker = new Worker(
  'document_processing',
  async (job: Job) => {
    const { documentId, companyId, filePath } = job.data;
    console.log(` Processing document: ${documentId} (Job: ${job.id})`);

    try {
      // 1. Update status to "processing" in the database
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'processing' }
      });

      // 2. Locate the file on disk (it's sitting in our uploads folder!)
      const fullPath = path.resolve(UPLOADS_DIR, filePath);

      // Verify file exists before attempting to read
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found at path: ${fullPath}`);
      }

      const fileBuffer = fs.readFileSync(fullPath);

      // 3. Extract Text based on file type
      let rawText = '';
      const lowerFilePath = filePath.toLowerCase();
      if (lowerFilePath.endsWith('.pdf')) {
        const data = await pdf(fileBuffer);
        rawText = data.text;
      } else if (lowerFilePath.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        rawText = result.value;
      } else {
        rawText = fileBuffer.toString(); // Assume plain text for everything else
      }

      // 3.5 Sanitize text (PostgreSQL doesn't like null characters \u0000)
      rawText = rawText.replace(/\0/g, '');

      // 4. Chunk the text into smaller pieces
      // 1,000 characters per chunk, with 200 characters of overlap
      const chunks = splitText(rawText, 1000, 200);

      // 5. Send chunks to the AI Service (The Brain!)
      await axios.post(`${AI_SERVICE_URL}/index`, {
        document_id: documentId,
        company_id: companyId,
        chunks: chunks
      });

      // 5.5. Store chunks in PostgreSQL for reference and retrieval
      const chunkRecords = chunks.map((chunk, index) => ({
        document_id: documentId,
        company_id: companyId,
        chunk_index: index,
        chunk_text: chunk,
        token_count: Math.ceil(chunk.length / 4), // Rough estimate: ~1 token per 4 characters
        vector_id: `${documentId}_${index}` // Reference ID for ChromaDB lookup
      }));

      await prisma.documentChunk.createMany({
        data: chunkRecords
      });

      // 6. Update document status to "indexed" on success
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

      // Update DB to "failed" so the user knows what happened
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'failed',
          error_message: errorMessage.replace(/\0/g, '')
        }
      });

      throw error; // Re-throw so BullMQ knows the job failed
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

console.log("🚀 Background Worker is alive and listening for tasks!");
