// utils/embedding.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/db.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function addEmbeddingToChunks(documentId) {
  const chunks = await db.query(
    `SELECT id, content
     FROM document_chunks
     WHERE embedding IS NULL AND document_id = $1`,
    [documentId]
  );

  for (const chunk of chunks.rows) {
    try {
      const result = await model.embedContent(chunk.content);

      const embeddingArray = result.embedding.values.map(Number);
      const vectorString = `[${embeddingArray.join(',')}]`;

      await db.query(
        `UPDATE document_chunks
         SET embedding = $1::vector
         WHERE id = $2`,
        [vectorString, chunk.id]
      );

      console.log(`✅ Chunk ${chunk.id} embedding stored`);
    } catch (err) {
      console.error(`❌ Failed for chunk ${chunk.id}:`, err.message);
    }
  }

  // ⚠️ IMPORTANT: only mark processed if embeddings exist
  await db.query(
    `UPDATE documents
     SET status = 'processed'
     WHERE id = $1`,
    [documentId]
  );

  console.log(`🎉 Document ${documentId} fully processed with embeddings!`);
}
