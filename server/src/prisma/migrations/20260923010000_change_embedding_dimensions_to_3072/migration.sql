-- Gemini Embedding 2 returns 3072-dimensional vectors.
-- Existing vectors cannot be converted between dimensions, so clear them and
-- regenerate embeddings by reprocessing the documents after this migration.
DROP INDEX IF EXISTS "document_chunks_embedding_hnsw_idx";

UPDATE "document_chunks"
SET "embedding" = NULL
WHERE "embedding" IS NOT NULL;

ALTER TABLE "document_chunks"
  ALTER COLUMN "embedding" TYPE vector(3072)
  USING NULL::vector(3072);

-- pgvector HNSW indexes support at most 2000 dimensions. Gemini Embedding 2
-- produces 3072 dimensions, so similarity queries use exact vector search.