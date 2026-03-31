import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { buildStoragePath, hasSupabaseStorageConfig, uploadBufferToStorage } from "@/lib/supabase-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 100MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (hasSupabaseStorageConfig()) {
      const storagePath = buildStoragePath("videos", file.name);
      const uploaded = await uploadBufferToStorage({
        path: storagePath,
        buffer,
        contentType: file.type,
      });
      return NextResponse.json({ url: uploaded.publicUrl }, { status: 200 });
    }

    // Vercel cannot persist local files across invocations.
    // Return data URL so the video URL can be stored with the block data.
    if (process.env.VERCEL === "1") {
      const url = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({ url }, { status: 200 });
    }

    const uploadsDir = join(process.cwd(), "public", "videos");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    const url = `/videos/${filename}`;
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
