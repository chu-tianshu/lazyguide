/**
 * Split guide text into sentence-sized chunks. Each chunk is spoken as one
 * utterance and highlighted as one caption unit. Very short fragments (e.g. the
 * "ca." in "ca. 1510") are merged into the sentence that follows them.
 */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const parts = normalized.match(/[^.!?]+(?:[.!?]+["’”)\]]*|$)/g) ?? [];

  const chunks: string[] = [];
  let pending = "";
  for (const part of parts) {
    const piece = (pending ? `${pending} ` : "") + part.trim();
    if (piece.length < 25) {
      pending = piece;
      continue;
    }
    chunks.push(piece);
    pending = "";
  }
  if (pending) {
    if (chunks.length) chunks[chunks.length - 1] += ` ${pending}`;
    else chunks.push(pending);
  }
  return chunks;
}
