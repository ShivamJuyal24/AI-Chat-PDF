import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { embedTexts, generateAnswer } from '../services/gemini.service.js';
import { ApiError } from '../utils/errors.js';

const MAX_QUESTION_LENGTH = 4000;

export const chat = async (req, res) => {
  const { documentId, message } = req.body ?? {};

  if (!documentId || typeof documentId !== 'string') {
    throw new ApiError(400, '"documentId" is required.');
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new ApiError(400, '"message" is required.');
  }
  if (message.length > MAX_QUESTION_LENGTH) {
    throw new ApiError(400, `Question is too long (max ${MAX_QUESTION_LENGTH} characters).`);
  }

  const userId = req.userId;

  // Ownership + readiness check — a not-yet-processed document has no
  // embeddings to retrieve from yet.
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
    select: { id: true, originalName: true, status: true, errorMessage: true },
  });
  if (!document) throw new ApiError(404, 'Document not found.');
  if (document.status !== 'PROCESSED') {
    throw new ApiError(
      409,
      document.status === 'FAILED'
        ? `This document failed to process: ${document.errorMessage ?? 'unknown error'}`
        : 'This document is still processing. Please try again shortly.'
    );
  }

  // 1. Embed the question with the same model as the chunks.
  const [questionVector] = await embedTexts([message.trim()]);

  // 2. Retrieve the most similar chunks owned by this document (cosine distance).
  const chunks = await prisma.$queryRaw`
    SELECT id, content, 1 - (embedding <=> ${questionVector}::vector) AS similarity
    FROM document_chunks
    WHERE document_id = ${documentId} AND embedding IS NOT NULL
    ORDER BY embedding <=> ${questionVector}::vector
    LIMIT ${env.topKChunks}
  `;

  if (chunks.length === 0) {
    throw new ApiError(503, 'No searchable content is available for this document yet. Please try again shortly.');
  }

  // 3. Ground the answer in the retrieved context, with recent conversation history.
  const history = await prisma.chatMessage.findMany({
    where: { documentId, userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { role: true, content: true },
  });

  const answer = await generateAnswer({
    documentTitle: document.originalName,
    question: message.trim(),
    contextChunks: chunks.map((chunk) => chunk.content),
    history: history.reverse(),
  });

  // 4. Persist the exchange so the conversation survives reloads.
  const [, assistantMessage] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { documentId, userId, role: 'USER', content: message.trim() },
    }),
    prisma.chatMessage.create({
      data: { documentId, userId, role: 'ASSISTANT', content: answer },
    }),
  ]);

  res.json({
    messageId: assistantMessage.id,
    documentId,
    answer,
    sources: chunks.slice(0, 4).map((chunk) => ({
      id: chunk.id,
      similarity: Number(chunk.similarity),
      snippet: chunk.content.slice(0, 200),
    })),
  });
};
