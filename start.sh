#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Sync Prisma schema with database
# --accept-data-loss allows destructive changes (be careful in production)
if prisma db push --skip-generate 2>&1; then
  echo "✅ Database schema synced successfully"
else
  echo "⚠️ Database sync had issues, server will start anyway..."
fi

echo "🚀 Starting server..."
exec node server.js
