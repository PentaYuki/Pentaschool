#!/usr/bin/env node
/**
 * Vercel build script that handles missing DATABASE_URL
 * This prevents Prisma from failing during build when env vars aren't set
 */

const { execSync } = require('child_process');
const path = require('path');

// Set dummy DATABASE_URL if not provided
// This allows Prisma to generate the client without database connection
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not set, using dummy value for build');
  process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost/dummy';
}

console.log('📦 Generating Prisma client...');
try {
  execSync('prisma generate', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Prisma generation failed:', error.message);
  process.exit(1);
}

console.log('🔨 Building Next.js application...');
try {
  execSync('next build', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
