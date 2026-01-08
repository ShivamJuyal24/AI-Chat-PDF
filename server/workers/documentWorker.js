import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { chunkText } from '../utils/chunkText.js';

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

      console.log(
        `🧠 [Job ${job.id}] Extracted text length: ${pdfData.text.length}`
      );

      const chunks = chunkText(pdfData.text);

      console.log(
        `📦 [Job ${job.id}] Created ${chunks.length} text chunks`
      );

      return { textLength: pdfData.text.length };
    } catch (err) {
      console.error(
        `❌ [Job ${job.id}] Failed processing documentId: ${documentId}`,
        err
      );
      throw err;
    }
  },
  {
    connection: redis,
  }
);

documentWorker.on('completed', (job) => {
  console.log(`✅ [Job ${job.id}] Completed chunking successfully`);
});

documentWorker.on('failed', (job, err) => {
  console.error(`❌ [Job ${job?.id}] Job failed`, err);
});
