-- AlterTable: capture why a document failed, surfaced to the client on GET /documents
ALTER TABLE "documents" ADD COLUMN "error_message" TEXT;

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_user_id_created_at_idx" ON "documents"("user_id", "created_at");
CREATE INDEX "chat_messages_document_id_created_at_idx" ON "chat_messages"("document_id", "created_at");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VectorSearchIndex: approximate nearest-neighbour index for cosine distance.
-- Not representable in Prisma schema, so it lives here as raw SQL.
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx"
    ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);
