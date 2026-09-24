import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import { timed } from '../utils/timed.js';

/** Uploads a PDF buffer to Supabase Storage. Files are keyed by owner: `userId/documentId.pdf`. */
export async function uploadPdf(storagePath, buffer) {
  const { error } = await timed('storage.upload', () => supabase.storage
    .from(env.supabaseBucket)
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true }), {
    bytes: buffer.length,
    bucket: env.supabaseBucket,
  });

  if (error) {
    throw new ApiError(502, `Failed to store uploaded file: ${error.message}`);
  }
}

/** Downloads a stored PDF as a Buffer (used by the document worker). */
export async function downloadPdf(storagePath) {
  const { data, error } = await timed('storage.download', () =>
    supabase.storage.from(env.supabaseBucket).download(storagePath),
    { bucket: env.supabaseBucket },
  );

  if (error || !data) {
    throw new Error(`Failed to download file from storage: ${error?.message ?? 'no data'}`);
  }

  return timed('storage.download.arrayBuffer', () => data.arrayBuffer(), {
    bucket: env.supabaseBucket,
  }).then((arrayBuffer) => Buffer.from(arrayBuffer));
}

/** Best-effort delete; a storage miss must not block document deletion. */
export async function deletePdf(storagePath) {
  const { error } = await supabase.storage.from(env.supabaseBucket).remove([storagePath]);
  if (error) {
    throw new Error(`Failed to delete file from storage: ${error.message}`);
  }
}
