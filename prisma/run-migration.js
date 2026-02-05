#!/usr/bin/env node
/**
 * Run manual SQL migration for multi-tenant RBAC
 * Handles existing data by creating default organizations
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Running multi-tenant migration...');

  // Step 1: Check if organizations table exists
  const tablesResult = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'organizations'
    ) as exists
  `;
  const orgsExist = tablesResult[0]?.exists;

  if (!orgsExist) {
    console.log('📋 Creating organizations table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'free',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
      )
    `);
  }

  // Step 2: Check if organization_members table exists
  const membersResult = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'organization_members'
    ) as exists
  `;
  const membersExist = membersResult[0]?.exists;

  if (!membersExist) {
    console.log('📋 Creating organization_members table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "organization_members" (
        "id" TEXT NOT NULL,
        "organization_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'vendedor',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
      )
    `);
  }

  // Step 3: Create organizations for users without one
  console.log('👥 Creating default organizations for existing users...');
  const users = await prisma.$queryRaw`
    SELECT id, email, name FROM users
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_members om WHERE om.user_id = users.id
    )
  `;

  for (const user of users) {
    const orgId = 'org_' + user.id;
    const orgName = (user.name || user.email.split('@')[0]) + "'s Organization";
    const slug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + user.id.substring(0, 8);

    try {
      // Create organization
      await prisma.$executeRawUnsafe(`
        INSERT INTO organizations (id, name, slug, plan, created_at, updated_at)
        VALUES ($1, $2, $3, 'free', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, orgId, orgName, slug);

      // Create membership
      await prisma.$executeRawUnsafe(`
        INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
        VALUES ($1, $2, $3, 'gerente', NOW())
        ON CONFLICT DO NOTHING
      `, 'mem_' + user.id, orgId, user.id);

      console.log(`  ✅ Created org for ${user.email}`);
    } catch (e) {
      console.log(`  ⚠️ Skipped org for ${user.email}: ${e.message}`);
    }
  }

  // Step 4: Add organization_id columns if missing
  const tables = [
    'whatsapp_numbers', 'contact_lists', 'campaigns', 'media_files',
    'message_templates', 'webhooks', 'pipeline_stages', 'deals',
    'deal_activities', 'deal_tasks', 'audit_logs', 'blacklist'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "organization_id" TEXT
      `);
    } catch (e) {
      // Column might already exist
    }
  }

  // Step 5: Update organization_id for existing data
  console.log('🔄 Migrating existing data to organizations...');

  const updates = [
    { table: 'whatsapp_numbers', userCol: 'user_id' },
    { table: 'contact_lists', userCol: 'user_id' },
    { table: 'campaigns', userCol: 'user_id' },
    { table: 'media_files', userCol: 'user_id' },
    { table: 'message_templates', userCol: 'user_id' },
    { table: 'webhooks', userCol: 'user_id' },
    { table: 'pipeline_stages', userCol: 'user_id' },
    { table: 'deals', userCol: 'user_id' },
    { table: 'audit_logs', userCol: 'user_id' },
  ];

  for (const { table, userCol } of updates) {
    try {
      const result = await prisma.$executeRawUnsafe(`
        UPDATE "${table}"
        SET organization_id = 'org_' || ${userCol}
        WHERE organization_id IS NULL AND ${userCol} IS NOT NULL
      `);
      console.log(`  ✅ Updated ${table}`);
    } catch (e) {
      console.log(`  ⚠️ Failed ${table}: ${e.message}`);
    }
  }

  // Step 6: Update deal_activities from deals
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE deal_activities da
      SET organization_id = d.organization_id
      FROM deals d
      WHERE da.deal_id = d.id AND da.organization_id IS NULL
    `);
    console.log('  ✅ Updated deal_activities');
  } catch (e) {
    console.log(`  ⚠️ Failed deal_activities: ${e.message}`);
  }

  // Step 7: Update deal_tasks from deals
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE deal_tasks dt
      SET organization_id = d.organization_id
      FROM deals d
      WHERE dt.deal_id = d.id AND dt.organization_id IS NULL
    `);
    console.log('  ✅ Updated deal_tasks');
  } catch (e) {
    console.log(`  ⚠️ Failed deal_tasks: ${e.message}`);
  }

  console.log('✅ Migration complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration error:', e.message);
    process.exit(0); // Don't fail startup
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
