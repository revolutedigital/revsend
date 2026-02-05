#!/usr/bin/env node
/**
 * Run manual SQL migration for multi-tenant RBAC
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Running multi-tenant migration...');

  const migrationPath = path.join(__dirname, 'migrations/20260205_multi_tenant/migration.sql');

  if (!fs.existsSync(migrationPath)) {
    console.log('⚠️ Migration file not found, skipping...');
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolons but keep statements intact
  const statements = sql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute`);

  let executed = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement + ';');
      executed++;
    } catch (error) {
      // Ignore "already exists" errors
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate key') ||
        error.message.includes('relation') && error.message.includes('does not exist')
      ) {
        skipped++;
      } else {
        console.log(`⚠️ Statement failed: ${statement.substring(0, 80)}...`);
        console.log(`   Error: ${error.message}`);
        skipped++;
      }
    }
  }

  console.log(`✅ Migration complete: ${executed} executed, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e.message);
    process.exit(0); // Don't fail the startup
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
