import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { buildStoragePath, hasSupabaseStorageConfig, uploadBufferToStorage } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (hasSupabaseStorageConfig()) {
      const storagePath = buildStoragePath('documents', file.name);
      const uploaded = await uploadBufferToStorage({
        path: storagePath,
        buffer,
        contentType: file.type || 'application/octet-stream',
      });

      return NextResponse.json({
        url: uploaded.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    // Vercel cannot persist writes to /public at runtime.
    // Return data URL so caller can store it in DB and serve directly.
    if (process.env.VERCEL === '1') {
      const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        url: dataUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    // Local development: write to disk
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const filename = `${timestamp}-${random}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
