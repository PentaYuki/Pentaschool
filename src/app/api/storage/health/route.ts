import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isTrueFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "school-files";
  const forceLocal = isTrueFlag(process.env.FORCE_LOCAL_UPLOADS);
  const hasPublicUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasPublicAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const result: Record<string, unknown> = {
    ok: false,
    vercel: process.env.VERCEL === "1",
    env: {
      hasSUPABASE_URL: Boolean(supabaseUrl),
      hasSUPABASE_SERVICE_ROLE_KEY: Boolean(serviceRole),
      hasNEXT_PUBLIC_SUPABASE_URL: hasPublicUrl,
      hasNEXT_PUBLIC_SUPABASE_ANON_KEY: hasPublicAnon,
      FORCE_LOCAL_UPLOADS: forceLocal,
      bucket,
    },
  };

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json(
      {
        ...result,
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 500 }
    );
  }

  try {
    const client = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      return NextResponse.json(
        {
          ...result,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const found = (buckets || []).find((b) => b.name === bucket || b.id === bucket);

    return NextResponse.json({
      ...result,
      ok: true,
      bucketExists: Boolean(found),
      bucketPublic: found?.public ?? null,
      bucketId: found?.id ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ...result,
        error: e instanceof Error ? e.message : "Unknown storage health error",
      },
      { status: 500 }
    );
  }
}
