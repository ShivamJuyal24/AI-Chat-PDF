# 📄 AI PDF Chat Application (Backend – Phase 1 to Phase 5)

A production-grade backend for an AI-powered PDF chat application, designed with real-world scalability and clean architecture in mind. This project currently implements secure authentication, PDF ingestion, background processing, text chunking, and vector embeddings stored using pgvector.

## 🚀 Project Status

- ✅ **Phase 1** – Core Backend & Authentication
- ✅ **Phase 2** – Background Queue (BullMQ + Redis)
- ✅ **Phase 3** – PDF Parsing & Text Chunking
- ✅ **Phase 4** – Database Storage (Documents + Chunks)
- ✅ **Phase 5** – Vector Embeddings with pgvector (Gemini)
- ⏳ **Phase 6** – Chat with PDF (Upcoming)

## 🧠 What This Project Demonstrates

- Secure JWT-based authentication using Clerk
- File upload handling with Multer
- Asynchronous background job processing using BullMQ + Redis
- PDF text extraction and intelligent chunking
- Vector embeddings generation using Google Gemini
- Semantic search-ready storage using PostgreSQL + pgvector
- Clean separation between API, queue, worker, and utility layers
- Industry-style backend architecture for RAG systems

## 🏗️ Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- pgvector
- Redis
- BullMQ

### Authentication
- Clerk (JWT-based authentication)

### File Handling
- Multer (local temporary storage)

### AI / Embeddings
- Google Gemini (`text-embedding-004`)

## 🔐 Authentication Flow (Clerk)

1. User authenticates on the frontend using Clerk
2. Frontend sends JWT in the `Authorization` header
3. Backend verifies the token using Clerk middleware
4. Only authenticated users can upload PDFs

❌ Unauthenticated requests return `401 Unauthorized`

## 📤 File Upload & Ingestion Flow

1. Authenticated user uploads a PDF
2. File is temporarily stored in `/uploads`
3. File metadata is saved in PostgreSQL (`documents` table)
4. A background job is added to BullMQ
5. API responds instantly (non-blocking)

## ⚙️ Background Processing (BullMQ + Redis)

- Redis acts as a job broker
- BullMQ manages asynchronous job execution
- A dedicated worker processes PDF ingestion

### Example Worker Logs

```
📄 Started processing documentId
🧠 Extracted text from PDF
📦 Stored chunks in database
🧠 Generated embeddings
🎉 Document fully processed
```

✔ Upload API remains fast  
✔ Heavy processing runs asynchronously

## 🧠 PDF Processing Pipeline (Phase 3–5)

1. PDF is parsed inside a BullMQ worker
2. Extracted text is split into semantic chunks
3. Each chunk is stored in `document_chunks`
4. Gemini generates embeddings for each chunk
5. Embeddings are stored using pgvector (`vector(768)`)

## 🗄️ Database Schema

### `documents`
Stores metadata about uploaded PDFs.

- `id`
- `user_id`
- `original_name`
- `file_name`
- `file_path`
- `file_size`
- `status`
- `created_at`

### `document_chunks`
Stores chunked text and vector embeddings.

- `id`
- `document_id`
- `chunk_index`
- `content`
- `embedding` (pgvector – 768 dimensions)

### `chat_history`
Prepared for Phase 6 (AI chat).

## 🛑 Important Notes

- `uploads/` is ignored by Git
- `.env` is never committed
- Local file storage is temporary
- Production setup will use object storage (e.g., S3)
- Embeddings are generated asynchronously to avoid API blocking

## 🎯 What's Next (Phase 6)

- Embed user queries
- Perform pgvector similarity search
- Retrieve top-k relevant chunks
- Generate grounded answers using Gemini
- Prevent hallucinations via context-only prompting

## 📌 Summary

This backend forms a complete ingestion and vectorization pipeline for a Retrieval-Augmented Generation (RAG) system and is ready for semantic search and AI-powered document chat.