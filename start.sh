#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Run SQL migration for multi-tenant support
if [ -f "prisma/run-migration.js" ]; then
  node prisma/run-migration.js || echo "⚠️ Migration script had issues..."
fi

# Sync remaining schema changes (accept data loss for constraint changes)
prisma db push --skip-generate --accept-data-loss && echo "✅ Database schema synced successfully" || echo "⚠️ Schema sync had issues, server will start anyway..."

echo "🚀 Starting server..."
exec node server.js
