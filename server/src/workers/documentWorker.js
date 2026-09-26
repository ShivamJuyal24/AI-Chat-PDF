import { randomUUID } from 'node:crypto';
import { Worker } from 'bullmq';
import { PDFParse } from 'pdf-parse';
import { bullConnection } from '../config/redis.js';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { downloadPdf } from '../services/storage.service.js';
import { embedTexts } from '../services/gemini.service.js';
import { chunkText } from '../utils/chunkText.js';
import { logger } from '../utils/logger.js';
import { QUEUE_NAME, JOB_NAME } from '../queues/documentQueue.js';
import { timed } from '../utils/timed.js';

const INSERT_BATCH_SIZE = 200;
const EMBEDDING_UPDATE_BATCH_SIZE = 200;
const WORKER_INSTANCE_KEY = Symbol.for('askpdf.documentWorker');

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const pdfData = await parser.getText();
    return pdfData.text;
  } finally {
    await parser.destroy();
  }
}

/** One UPDATE per batch via jsonb — avoids a network round trip per chunk. */
async function storeEmbeddings(chunkRows, vectorStrings) {
  for (let i = 0; i < chunkRows.length; i += EMBEDDING_UPDATE_BATCH_SIZE) {
    const rows = chunkRows.slice(i, i + EMBEDDING_UPDATE_BATCH_SIZE);
    const vectors = vectorStrings.slice(i, i + EMBEDDING_UPDATE_BATCH_SIZE);

    const idToVector = {};
    rows.forEach((row, index) => {
      idToVector[row.id] = vectors[index];
    });

    await prisma.$executeRaw`
      UPDATE document_chunks AS dc
      SET embedding = e.value::vector
      FROM jsonb_each_text(${JSON.stringify(idToVector)}::jsonb) AS e
      WHERE dc.id::text = e.key
    `;
  }
}

async function processDocument(job) {
  const { documentId, storagePath } = job.data;
  const log = (message) => logger.info(`[job ${job.id} | doc ${documentId}] ${message}`);

  log(`started (attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? 1})`);
  await timed('worker.status-processing', () => prisma.document.update({
    where: { id: documentId },
    data: { status: 'PROCESSING', errorMessage: null },
  }), { jobId: job.id, documentId });
  log('status set to PROCESSING');

  // 1. Fetch the PDF from Supabase Storage and extract its text.
  log(`downloading PDF from storage: ${storagePath}`);
  const buffer = await timed('worker.storage-download', () => downloadPdf(storagePath), { jobId: job.id, documentId });
  log(`PDF downloaded (${buffer.length} bytes); extracting text`);
  const text = await timed('worker.pdf-parse', () => extractPdfText(buffer), { jobId: job.id, documentId });
  log(`text extraction finished (${text.length} characters)`);

  if (!text || text.replace(/\s/g, '').length < 20) {
    throw new Error(
      'No extractable text found in this PDF. Scanned/image-only PDFs are not supported.'
    );
  }

  // 2. Chunk the text.
  const chunks = chunkText(text);
  logger.info('Timing', { label: 'worker.chunking', jobId: job.id, documentId, durationMs: 0, chunkCount: chunks.length });
  if (chunks.length === 0) {
    throw new Error('Chunking produced no chunks from the extracted text.');
  }
  if (chunks.length > env.maxChunksPerDocument) {
    throw new Error(
      `Document is too large: ${chunks.length} chunks (limit ${env.maxChunksPerDocument}).`
    );
  }
  log(`extracted ${text.length} chars -> ${chunks.length} chunks`);
  await job.updateProgress(30);

  // 3. Prepare rows once so chunk persistence and embedding can run together.
  const isRetry = job.attemptsMade > 0;
  if (isRetry) {
    await timed('worker.chunk-delete', () => prisma.documentChunk.deleteMany({ where: { documentId } }), { jobId: job.id, documentId });
    log('cleared previous chunks before retry');
  } else {
    log('skipped chunk delete on first attempt');
  }
  const chunkRows = chunks.map((content, index) => ({
    id: randomUUID(),
    documentId,
    chunkIndex: index,
    content,
  }));

  const persistChunks = async () => {
    log(`persisting ${chunkRows.length} chunks in batches of ${INSERT_BATCH_SIZE}`);
    for (let i = 0; i < chunkRows.length; i += INSERT_BATCH_SIZE) {
      await timed('worker.chunk-insert', () => prisma.documentChunk.createMany({
        data: chunkRows.slice(i, i + INSERT_BATCH_SIZE),
      }), { jobId: job.id, documentId, batchStart: i, batchSize: Math.min(INSERT_BATCH_SIZE, chunkRows.length - i) });
      log(`persisted chunks ${i + 1}-${Math.min(i + INSERT_BATCH_SIZE, chunkRows.length)}`);
    }
  };

  // Chunk persistence and embedding generation do not depend on each other.
  log(`generating embeddings and persisting ${chunks.length} chunks concurrently`);
  const [, vectorStrings] = await Promise.all([
    persistChunks(),
    timed('worker.embedding-total', () => embedTexts(chunks), { jobId: job.id, documentId, chunkCount: chunks.length }),
  ]);
  await job.updateProgress(55);
  log(`embeddings generated (${vectorStrings.length} vectors); storing vectors`);
  await job.updateProgress(80);

  await timed('worker.embedding-store', () => storeEmbeddings(chunkRows, vectorStrings), { jobId: job.id, documentId, vectorCount: vectorStrings.length });
  log('embeddings stored successfully');

  await timed('worker.status-processed', () => prisma.document.update({
    where: { id: documentId },
    data: { status: 'PROCESSED' },
  }), { jobId: job.id, documentId });
  await job.updateProgress(100);

  log(`completed successfully; status set to PROCESSED (${chunkRows.length} chunks embedded)`);
  return { chunksInserted: chunkRows.length };
}

export function startDocumentWorker() {
  if (globalThis[WORKER_INSTANCE_KEY]) {
    return globalThis[WORKER_INSTANCE_KEY];
  }

  const documentWorker = new Worker(QUEUE_NAME, processDocument, {
    connection: bullConnection,
    concurrency: env.workerConcurrency,
  });

  documentWorker.on('completed', (job) => {
    logger.info(
      `[job ${job.id} | doc ${job.data?.documentId ?? '?'}] completed event received | chunks: ${job.returnvalue?.chunksInserted ?? '?'}`
    );
  });

  documentWorker.on('failed', async (job, err) => {
    const attempts = job?.opts?.attempts ?? 1;
    const isFinalAttempt = (job?.attemptsMade ?? attempts) >= attempts;
    logger.error(
      `[job ${job?.id ?? '?'} | doc ${job?.data?.documentId ?? '?'}] failed (attempt ${job?.attemptsMade ?? '?'}/${attempts}):`,
      { message: err.message, stack: err.stack }
    );

    if (job?.data?.documentId && isFinalAttempt) {
      await prisma.document
        .update({
          where: { id: job.data.documentId },
          data: {
            status: 'FAILED',
            errorMessage: err.message.slice(0, 500),
          },
        })
        .then(() =>
          logger.error(`[job ${job.id} | doc ${job.data.documentId}] status set to FAILED`)
        )
        .catch((updateErr) =>
          logger.error(
            `[job ${job.id} | doc ${job.data.documentId}] could not mark document FAILED:`,
            updateErr.message
          )
        );
    }
  });

  documentWorker.on('error', (err) => {
    logger.error('worker error:', err.message);
  });

  logger.info(
    `🧵 Document worker started on queue "${QUEUE_NAME}" (job: ${JOB_NAME}, concurrency: ${env.workerConcurrency})`
  );

  globalThis[WORKER_INSTANCE_KEY] = documentWorker;
  return documentWorker;
}
