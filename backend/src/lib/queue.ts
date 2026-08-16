import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// 1. Setup the connection to our Redis container
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Required by BullMQ
});

// 2. Define the name for our "Document Processing" queue
export const DOCUMENT_QUEUE_NAME = 'document_processing';

// 3. Create the actual Queue object
export const documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times if something fails (network issues, etc.)
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s, then 10s, then 20s between retries
    },
    removeOnComplete: true, // Clean up successful jobs to save Redis memory
  },
});

console.log(`📡 BullMQ: Initialized queue "${DOCUMENT_QUEUE_NAME}"!`);
