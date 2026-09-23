# AI Chat PDF — Server

Production backend for a multi-user RAG chat-with-PDF application.

**Stack:** Node 20+ · Express 5 · Prisma + Supabase Postgres (pgvector) · Supabase Storage · Upstash Redis (BullMQ) · Google Gemini · Clerk

No Docker — the server is a plain Node process designed for PaaS deployment (Render / Railway / Fly.io) with two services: the **API** (`index.js`) and the **document worker** (`worker.js`).

## Architecture

```
Client (Next.js + Clerk)
   │  Bearer <Clerk JWT>
   ▼
API (index.js)  ── validates env, auth, rate limits
   │  upload: multer(memory) → Supabase Storage → Document row → BullMQ job
   │  chat:   embed question → pgvector cosine top-K → Gemini answer → persist
   ▼
Upstash Redis (BullMQ)  ──►  Worker (worker.js)
                                download PDF → parse → chunk → embed → store vectors
```

- **Multi-user:** every document, chunk lookup, and chat message is scoped by the Clerk `userId`. Files in storage are keyed `userId/documentId.pdf` in a **private** bucket.
- **Queue:** uploads return immediately (`201`); processing happens in the worker with 3 attempts and exponential backoff. Clients poll `GET /api/v1/documents/:id` for status.
- **Retrieval:** `vector(3072)` column (Gemini Embedding 2) with exact cosine search; chat embeds the question with the same model and retrieves the top-K chunks for that document.

## Setup

### 1. Environment

```bash
cp .env.example .env   # then fill in every value
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase → Settings → Database → Connection string (transaction / session pooler) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `UPSTASH_REDIS_URL` | Upstash console → your database → Redis URL (`rediss://…`) |
| `GEMINI_API_KEY` | Google AI Studio |
| `GROQ_API_KEY` | Groq console, used as chat fallback |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys |

### 2. Storage bucket (one-time)

Create a **private** bucket named `documents` — Supabase dashboard → Storage, or via SQL:

```sql
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
```

The server uses the service-role key, which bypasses storage RLS; access control is enforced in application code (every path is prefixed with the authenticated `userId`).

### 3. Database migrations

```bash
npm install            # also runs `prisma generate`
npm run db:migrate     # applies pending migrations (0001 + 0002)
```

> If your tables were created earlier with `prisma db push` (no `_prisma_migrations` rows), baseline first so `0001_init` isn't re-applied:
> `npx prisma migrate resolve --applied 0001_init`

The latest migration changes embeddings to `vector(3072)`. HNSW is not used because pgvector limits HNSW indexes to 2000 dimensions; similarity search is exact.

### 4. Run (two processes)

```bash
npm run dev            # API on :5000
npm run dev:worker     # document worker (separate terminal)
```

Production: `npm start` and `npm run start:worker` (deploy them as two services so the worker can scale independently).

## API

Base URL: `/api/v1` — all routes except `/health` require `Authorization: Bearer <Clerk session JWT>`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Public readiness probe (checks Postgres + Redis, `503` when degraded) |
| GET | `/me` | Echoes the authenticated `userId` — use to verify token wiring |
| POST | `/upload` | Multipart `file` field, PDF only (magic-byte checked, default 20MB). Returns `201 { documentId, status: "UPLOADED" }` |
| GET | `/documents` | List the user's documents with status + chunk counts |
| GET | `/documents/:id` | Document status/details (poll this after upload) |
| GET | `/documents/:id/messages` | Chat history for a document |
| DELETE | `/documents/:id` | Deletes the document, chunks, messages, and stored PDF |
| POST | `/chat` | `{ documentId, message }` → grounded answer + sources. `409` until the document is `PROCESSED` |

Rate limits (per user, Redis-backed): uploads 10/hour, chat 20/minute (both env-tunable).

## Production notes

- **Env validation** — the process exits immediately with a clear message if any required variable is missing.
- **Graceful shutdown** — both processes drain BullMQ, close Redis, and disconnect Prisma on SIGTERM/SIGINT.
- **Fail-safe upload** — storage upload, DB row, and enqueue are compensated (orphaned storage objects are deleted on failure).
- **Gemini retries** — embedding/generation calls retry 3× with exponential backoff on quota/5xx/network errors; embeddings are batched (100/batch) and written back to Postgres in bulk via a single `UPDATE … FROM jsonb_each_text`.
- **Scanned PDFs** — rejected with a clear `errorMessage` (stored on the document and returned by the API).
- **Client wiring** — point `NEXT_PUBLIC_API_URL` at the API origin (for example `http://localhost:5000`). The client appends `/api/v1` and sends the Clerk token:

  ```ts
  const token = await window.Clerk.session?.getToken();
  fetch(`${API_URL}/chat`, { headers: { Authorization: `Bearer ${token}` } /* … */ });
  ```
