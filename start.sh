#!/bin/sh
set -e

# Run Prisma migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  node node_modules/prisma/build/index.js migrate deploy || echo "Migration skipped or failed (non-fatal)"
fi

# Start the Next.js server
exec node server.js
