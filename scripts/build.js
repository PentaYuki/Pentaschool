#!/usr/bin/env node
/**
 * Vercel build script — handles DATABASE_URL resolution before Prisma generate.
 *
 * Priority order for DB connection string:
 *   1. DATABASE_URL              (set explicitly in Vercel env vars — preferred)
 *   2. POSTGRES_PRISMA_URL       (Vercel Postgres / Neon integration)
 *   3. POSTGRES_URL_NON_POOLING  (Vercel Postgres non-pooled)
 *   4. POSTGRES_URL              (Vercel Postgres pooled)
 *   5. SUPABASE_DB_URL           (Supabase direct connection)
 *   6. Dummy value               (build-time only, no real DB access needed for `prisma generate`)
 */

const { execSync } = require('child_process');
const path = require('path');

// ── 1. Resolve DATABASE_URL ──────────────────────────────────────────────────

const FALLBACK_VARS = [
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL',
  'SUPABASE_DB_URL',
];

if (!process.env.DATABASE_URL) {
  let resolved = null;

  for (const varName of FALLBACK_VARS) {
    if (process.env[varName]) {
      resolved = process.env[varName];
      console.log(`ℹ️  DATABASE_URL not set — using ${varName} instead`);
      process.env.DATABASE_URL = resolved;
      break;
    }
  }

  if (!resolved) {
    console.warn('⚠️  No database URL found in environment.');
    console.warn('    Using dummy URL so Prisma client can be generated.');
    console.warn('    → Go to Vercel → Settings → Environment Variables');
    console.warn('    → Add: DATABASE_URL = <your Neon/Supabase connection string>');
    process.env.DATABASE_URL =
      'postgresql://build_placeholder:build_placeholder@localhost:5432/build_placeholder';
  }
} else {
  console.log('✅ DATABASE_URL is set');
}

// ── 2. Prisma generate ───────────────────────────────────────────────────────

console.log('\n📦 Generating Prisma client...');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });
  console.log('✅ Prisma client generated\n');
} catch (error) {
  console.error('❌ Prisma generation failed:', error.message);
  process.exit(1);
}

// ── 3. Next.js build ─────────────────────────────────────────────────────────

console.log('🔨 Building Next.js application...');
try {
  execSync('next build', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

