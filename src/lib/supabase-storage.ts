import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "school-files";

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function sanitizePathPart(part: string): string {
  return part.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function hasSupabaseStorageConfig(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function buildStoragePath(kind: string, originalFileName: string): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");

  const safeName = sanitizePathPart(originalFileName || "file");
  return `${sanitizePathPart(kind)}/${y}/${m}/${d}/${Date.now()}-${randomId()}-${safeName}`;
}

export async function uploadBufferToStorage(params: {
  path: string;
  buffer: Buffer;
  contentType?: string;
  cacheControl?: string;
}) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(params.path, params.buffer, {
    contentType: params.contentType,
    cacheControl: params.cacheControl || "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(params.path);

  return {
    bucket: STORAGE_BUCKET,
    path: params.path,
    publicUrl: data.publicUrl,
  };
}

export function getStoragePublicUrl(path: string): string {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function guessContentTypeByFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".js")) return "text/javascript";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".woff")) return "font/woff";
  if (lower.endsWith(".woff2")) return "font/woff2";
  if (lower.endsWith(".ttf")) return "font/ttf";
  if (lower.endsWith(".otf")) return "font/otf";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}
