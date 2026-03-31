import { NextRequest, NextResponse } from "next/server";
import {
  buildStoragePath,
  createSignedUploadForPath,
  hasSupabaseStorageConfig,
} from "@/lib/supabase-storage";

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseStorageConfig()) {
      return NextResponse.json(
        { error: "Supabase storage is not configured on server" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const folder = typeof body?.folder === "string" ? body.folder : "uploads";
    const fileName = typeof body?.fileName === "string" ? body.fileName : "file.bin";

    const path = buildStoragePath(folder, fileName);
    const signed = await createSignedUploadForPath(path);

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
