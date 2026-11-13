import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuddyMemoryClient } from "./memory-client";

const BUCKET = "buddy-uploads";

export interface RecordedUpload {
  readonly source: string;
  readonly label: string;
  readonly storage_path: string;
  readonly last_synced_at: string;
  readonly bytes: number;
}

function storagePath(ownerId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${ownerId}/${stamp}-${safe}`;
}

/**
 * Paste a transcript or ticket export (no Storage round-trip).
 */
export async function recordPastedTranscript(
  client: BuddyMemoryClient,
  ownerId: string,
  label: string,
  content: string,
  filename: string,
): Promise<RecordedUpload> {
  const path = storagePath(ownerId, filename);
  const bytes = Buffer.from(content, "utf8");
  const storage = client.storage();
  const { error: uploadError } = await storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "text/plain", upsert: false });
  if (uploadError) {
    throw uploadError;
  }
  const now = new Date().toISOString();
  await client.upsertMemorySource(ownerId, {
    source: path,
    label,
    last_synced_at: now,
  });
  return {
    source: path,
    label,
    storage_path: path,
    last_synced_at: now,
    bytes: bytes.length,
  };
}

/**
 * Upload bytes to `buddy-uploads` and record `buddy.memory_sources`.
 */
export async function uploadTranscriptBytes(
  client: BuddyMemoryClient,
  ownerId: string,
  label: string,
  filename: string,
  bytes: Buffer,
): Promise<RecordedUpload> {
  const path = storagePath(ownerId, filename);
  const storage = client.storage();
  const { error: uploadError } = await storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "text/plain", upsert: false });
  if (uploadError) {
    throw uploadError;
  }
  const now = new Date().toISOString();
  await client.upsertMemorySource(ownerId, {
    source: path,
    label,
    last_synced_at: now,
  });
  return {
    source: path,
    label,
    storage_path: path,
    last_synced_at: now,
    bytes: bytes.length,
  };
}

/**
 * Read stored object text for morning check-in (best-effort).
 */
export async function readUploadExcerpt(
  client: SupabaseClient,
  path: string,
  maxChars = 800,
): Promise<string | null> {
  const { data, error } = await client.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  const text = await data.text();
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}…`;
}
