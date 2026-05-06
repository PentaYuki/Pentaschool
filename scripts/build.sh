#!/bin/bash
# Build script for Vercel that handles missing DATABASE_URL

# Set a dummy DATABASE_URL if not provided
# This prevents Prisma from failing during build
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"
fi

# Generate Prisma client
prisma generate

# Build Next.js app
next build
