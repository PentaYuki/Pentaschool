import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { buildStoragePath, hasSupabaseStorageConfig, uploadBufferToStorage } from '@/lib/supabase-storage';

// Cấu hình upload
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

/**
 * POST /api/upload
 * Xử lý upload ảnh
 * Expected: FormData với key 'file'
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file được gửi' },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Loại file không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (hasSupabaseStorageConfig()) {
      const storagePath = buildStoragePath('images', file.name);
      const uploaded = await uploadBufferToStorage({
        path: storagePath,
        buffer,
        contentType: file.type,
      });

      return NextResponse.json(
        {
          success: true,
          url: uploaded.publicUrl,
          filename: file.name,
        },
        { status: 200 }
      );
    }

    // Vercel filesystem is ephemeral/read-only for persistent assets.
    // Store image as data URL so it persists in DB references.
    if (process.env.VERCEL === '1') {
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      return NextResponse.json(
        {
          success: true,
          url: dataUrl,
          filename: file.name,
        },
        { status: 200 }
      );
    }

    // Local development: keep disk-based upload behavior
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${random}.${extension}`;

    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    const uploadUrl = `/uploads/${filename}`;

    return NextResponse.json(
      {
        success: true,
        url: uploadUrl,
        filename,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi upload file' },
      { status: 500 }
    );
  }
}
