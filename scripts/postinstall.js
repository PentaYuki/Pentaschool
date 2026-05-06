#!/usr/bin/env node
/**
 * Safe postinstall — runs `prisma generate` after ensuring DATABASE_URL is set.
 *
 * Why: The bare `prisma generate` in postinstall fails on Vercel because
 * DATABASE_URL is not available during `npm install` (only during build).
 * This wrapper sets a safe dummy URL if nothing is found.
 */

const { execSync } = require('child_process');
const path = require('path');

// ── Resolve DATABASE_URL (same priority order as build.js) ──────────────────

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
      console.log(`ℹ️  [postinstall] DATABASE_URL not set — using ${varName}`);
      process.env.DATABASE_URL = resolved;
      break;
    }
  }

  if (!resolved) {
    console.warn('⚠️  [postinstall] No DATABASE_URL found — using dummy for prisma generate');
    process.env.DATABASE_URL =
      'postgresql://build_placeholder:build_placeholder@localhost:5432/build_placeholder';
  }
} else {
  console.log('✅ [postinstall] DATABASE_URL is set');
}

// ── Run prisma generate ─────────────────────────────────────────────────────

console.log('📦 [postinstall] Running prisma generate...');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });
  console.log('✅ [postinstall] Prisma client generated');
} catch (error) {
  console.error('❌ [postinstall] prisma generate failed:', error.message);
  process.exit(1);
}
