import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';

export const documentWorker = new Worker(
  'documents',
  async (job) => {
    console.log('📄 Processing documentId:', job.data.documentId);
  },
  {
    connection: redis, // 🔥 THIS IS THE FIX
  }
);

documentWorker.on('completed', (job) => {
  console.log('✅ Job completed:', job.id);
});

documentWorker.on('failed', (job, err) => {
  console.error('❌ Job failed:', job.id, err);
});
