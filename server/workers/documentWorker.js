import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { chunkText } from '../utils/chunkText.js';
import { db } from '../config/db.js';
import { addEmbeddingToChunks } from '../utils/embedding.js'; // ✅ Gemini version

export const documentWorker = new Worker(
  'document-queue',
  async (job) => {
    const { filePath, documentId } = job.data;

    console.log(`📄 [Job ${job.id}] Started processing documentId: ${documentId}`);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const uint8Array = new Uint8Array(fileBuffer);
      const parser = new PDFParse(uint8Array);
      const pdfData = await parser.getText();

      const chunks = chunkText(pdfData.text);

      console.log(`🧠 [Job ${job.id}] Extracted text length: ${pdfData.text.length}`);

      // 🔹 INSERT CHUNKS
      for (let i = 0; i < chunks.length; i++) {
        await db.query(
          `INSERT INTO document_chunks (document_id, chunk_index, content)
           VALUES ($1, $2, $3)`,
          [documentId, i, chunks[i]]
        );
      }

      console.log(`📦 [Job ${job.id}] Stored ${chunks.length} chunks in DB`);

      // 🔹 AUTOMATIC EMBEDDINGS (Phase 5) with Gemini
      console.log(`🧠 [Job ${job.id}] Generating embeddings for document ${documentId}...`);
      await addEmbeddingToChunks(documentId);
      console.log(`✅ [Job ${job.id}] Embeddings generated for document ${documentId}`);

      return { chunksInserted: chunks.length };
    } catch (err) {
      console.error(`❌ [Job ${job.id}] Failed processing documentId: ${documentId}`, err);
      throw err;
    }
  },
  {
    connection: redis,
  }
);

documentWorker.on('completed', (job) => {
  console.log(`✅ [Job ${job.id}] Completed | Chunks inserted: ${job.returnvalue?.chunksInserted}`);
});

documentWorker.on('failed', (job, err) => {
  console.error(`❌ [Job ${job?.id}] Failed`, err);
});
