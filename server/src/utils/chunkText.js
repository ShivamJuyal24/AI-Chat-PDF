/**
 * Splits extracted PDF text into overlapping, sentence-aware chunks.
 *
 * Chunking on sentence boundaries keeps semantic units intact, and the
 * character overlap preserves continuity across chunk borders for retrieval.
 */
export function chunkText(
  text,
  { maxChunkChars = 1200, overlapChars = 200 } = {}
) {
  if (!text) return [];

  const normalized = text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) return [];

  const overlap = Math.min(overlapChars, Math.floor(maxChunkChars / 2));

  const sentences = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    // A single sentence longer than the cap (e.g. an unbroken table dump) is hard-split.
    if (sentence.length >= maxChunkChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      for (let i = 0; i < sentence.length; i += maxChunkChars) {
        chunks.push(sentence.slice(i, i + maxChunkChars));
      }
      continue;
    }

    if (!current) {
      current = sentence;
      continue;
    }

    if (current.length + sentence.length + 1 <= maxChunkChars) {
      current += ` ${sentence}`;
    } else {
      chunks.push(current);
      const tail = current.slice(-overlap);
      current = tail ? `${tail} ${sentence}` : sentence;
    }
  }

  if (current) chunks.push(current);

  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}
