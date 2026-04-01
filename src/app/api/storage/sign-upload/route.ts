import { NextRequest, NextResponse } from "next/server";
import {
  buildStoragePath,
  createSignedUploadForPath,
  hasSupabaseStorageConfig,
} from "@/lib/supabase-storage";

function sanitizeStoragePath(inputPath: string): string {
  const normalized = inputPath.replace(/\\/g, "/").trim();
  const parts = normalized.split("/").filter((p) => p && p !== "." && p !== "..");
  if (parts.length === 0) return "uploads/file.bin";
  return parts.map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "-")).join("/");
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseStorageConfig()) {
      return NextResponse.json(
        { error: "Supabase storage is not configured on server" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const explicitPath = typeof body?.path === "string" ? body.path : "";
    const folder = typeof body?.folder === "string" ? body.folder : "uploads";
    const fileName = typeof body?.fileName === "string" ? body.fileName : "file.bin";
    const upsert = typeof body?.upsert === "boolean" ? body.upsert : true;

    const path = explicitPath ? sanitizeStoragePath(explicitPath) : buildStoragePath(folder, fileName);
    const signed = await createSignedUploadForPath(path, { upsert });

    return NextResponse.json({
      path: signed.path,
      token: signed.token,
      bucket: signed.bucket,
      publicUrl: signed.publicUrl,
    });
  } catch (error) {
    console.error("[POST /api/storage/sign-upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign upload" },
      { status: 500 }
    );
  }
}
