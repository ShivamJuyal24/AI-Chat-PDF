import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse'; // ✅ Fixed: pdf-parse exports a default function, not a named class
import { chunkText } from '../utils/chunkText.js';
import { db } from '../config/db.js';
import { addEmbeddingToChunks } from '../utils/embedding.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const log = (jobId, msg) => console.log(`[Job ${jobId}] ${msg}`);
const logErr = (jobId, msg, err) => console.error(`[Job ${jobId}] ❌ ${msg}`, err.message);

/**
 * Bulk insert all chunks in a single query instead of N round-trips.
 * Falls back silently if chunks array is empty.
 */
const bulkInsertChunks = async (documentId, chunks) => {
  if (!chunks.length) return;

  const values = chunks.flatMap((chunk, i) => [documentId, i, chunk]);
  const placeholders = chunks
    .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
    .join(', ');

  await db.query(
    `INSERT INTO document_chunks (document_id, chunk_index, content) VALUES ${placeholders}`,
    values
  );
};

// ─── Worker ─────────────────────────────────────────────────────────────────

export const documentWorker = new Worker(
  'document-queue',
  async (job) => {
    const { filePath, documentId } = job.data;
    log(job.id, `Started → documentId: ${documentId}`);

    // Step 1: Read + parse PDF
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer); // ✅ No need to wrap in Uint8Array
    const chunks = chunkText(pdfData.text);

    log(job.id, `Extracted ${pdfData.text.length} chars → ${chunks.length} chunks`);
    await job.updateProgress(33);

    // Step 2: Bulk insert (was: N sequential awaits in a for-loop)
    await bulkInsertChunks(documentId, chunks);
    log(job.id, `Stored ${chunks.length} chunks`);
    await job.updateProgress(66);

    // Step 3: Embeddings
    log(job.id, `Generating embeddings...`);
    await addEmbeddingToChunks(documentId);
    await job.updateProgress(100);

    return { chunksInserted: chunks.length };
  },
  {
    connection: redis,
    concurrency: 4,              // ✅ Process up to 4 jobs in parallel
    removeOnComplete: { count: 100 }, // ✅ Auto-clean completed jobs
    removeOnFail: { count: 50 },      // ✅ Keep last 50 failed for debugging
  }
);

// ─── Events ─────────────────────────────────────────────────────────────────

documentWorker.on('completed', (job) => {
  log(job.id, `✅ Complete | Chunks inserted: ${job.returnvalue?.chunksInserted}`);
});

documentWorker.on('failed', (job, err) => {
  logErr(job?.id ?? 'unknown', 'Job failed', err);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

const shutdown = async (signal) => {
  console.log(`\n${signal} received — draining worker...`);
  await documentWorker.close(); // ✅ Waits for active jobs to finish
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));