/**
 * Migration Script: Single-User to Multi-Tenant
 *
 * This script migrates existing data from the single-user model to multi-tenant.
 * It should be run ONCE after applying the Prisma migration.
 *
 * Usage: npx ts-node prisma/migrations/manual/migrate-to-multi-tenant.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

async function migrateToMultiTenant() {
  console.log('Starting multi-tenant migration...\n')

  // Get all users
  const users = await prisma.user.findMany({
    include: {
      organizations: true,
    },
  })

  console.log(`Found ${users.length} users to migrate\n`)

  for (const user of users) {
    console.log(`\nMigrating user: ${user.email}`)

    // Skip if user already has an organization
    if (user.organizations.length > 0) {
      console.log(`  User already has ${user.organizations.length} organization(s), skipping...`)
      continue
    }

    // Create organization for user
    const orgName = user.name ? `${user.name}'s Org` : `${user.email.split('@')[0]}'s Org`
    let slug = generateSlug(orgName)

    // Ensure unique slug
    let slugSuffix = 0
    let finalSlug = slug
    while (true) {
      const existing = await prisma.organization.findUnique({ where: { slug: finalSlug } })
      if (!existing) break
      slugSuffix++
      finalSlug = `${slug}-${slugSuffix}`
    }

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: finalSlug,
        plan: 'free',
      },
    })
    console.log(`  Created organization: ${org.name} (${org.slug})`)

    // Add user as gerente (manager) in the organization
    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'gerente',
      },
    })
    console.log(`  Added user as gerente`)

    // Migrate WhatsApp numbers
    const whatsappCount = await prisma.whatsappNumber.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (whatsappCount.count > 0) {
      console.log(`  Migrated ${whatsappCount.count} WhatsApp numbers`)
    }

    // Migrate Contact Lists
    const listsCount = await prisma.contactList.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (listsCount.count > 0) {
      console.log(`  Migrated ${listsCount.count} contact lists`)
    }

    // Migrate Campaigns
    const campaignsCount = await prisma.campaign.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (campaignsCount.count > 0) {
      console.log(`  Migrated ${campaignsCount.count} campaigns`)
    }

    // Migrate Media Files
    const mediaCount = await prisma.mediaFile.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (mediaCount.count > 0) {
      console.log(`  Migrated ${mediaCount.count} media files`)
    }

    // Migrate Message Templates
    const templatesCount = await prisma.messageTemplate.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (templatesCount.count > 0) {
      console.log(`  Migrated ${templatesCount.count} message templates`)
    }

    // Migrate Webhooks
    const webhooksCount = await prisma.webhook.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (webhooksCount.count > 0) {
      console.log(`  Migrated ${webhooksCount.count} webhooks`)
    }

    // Migrate Pipeline Stages
    const stagesCount = await prisma.pipelineStage.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (stagesCount.count > 0) {
      console.log(`  Migrated ${stagesCount.count} pipeline stages`)
    }

    // Migrate Deals (also set assignedToId = userId for owner)
    const dealsCount = await prisma.deal.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: {
        organizationId: org.id,
        assignedToId: user.id, // Assign deals to the original creator
      },
    })
    if (dealsCount.count > 0) {
      console.log(`  Migrated ${dealsCount.count} deals (assigned to user)`)
    }

    // Migrate Deal Activities
    const activitiesCount = await prisma.dealActivity.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (activitiesCount.count > 0) {
      console.log(`  Migrated ${activitiesCount.count} deal activities`)
    }

    // Migrate Deal Tasks (also set assignedToId)
    const tasksCount = await prisma.dealTask.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: {
        organizationId: org.id,
        assignedToId: user.id, // Assign tasks to the original creator
      },
    })
    if (tasksCount.count > 0) {
      console.log(`  Migrated ${tasksCount.count} deal tasks (assigned to user)`)
    }

    // Migrate Audit Logs
    const auditCount = await prisma.auditLog.updateMany({
      where: { userId: user.id, organizationId: null as unknown as undefined },
      data: { organizationId: org.id },
    })
    if (auditCount.count > 0) {
      console.log(`  Migrated ${auditCount.count} audit logs`)
    }

    // Create default blacklist keywords for LGPD compliance
    const defaultKeywords = ['pare', 'parar', 'sair', 'cancelar', 'remover', 'stop', 'não quero']
    for (const keyword of defaultKeywords) {
      await prisma.blacklistKeyword.upsert({
        where: { organizationId_keyword: { organizationId: org.id, keyword } },
        create: { organizationId: org.id, keyword },
        update: {},
      })
    }
    console.log(`  Created ${defaultKeywords.length} default blacklist keywords`)

    // Create default lead roulette config (disabled by default)
    await prisma.leadRouletteConfig.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        enabled: false,
        strategy: 'weighted_round_robin',
      },
      update: {},
    })
    console.log(`  Created lead roulette config (disabled)`)

    console.log(`  User ${user.email} migration complete!`)
  }

  // Update global blacklist entries to have null organizationId (they stay global)
  // No action needed as they're already null

  console.log('\n\nMigration complete!')
  console.log('\nSummary:')

  const orgsCount = await prisma.organization.count()
  const membersCount = await prisma.organizationMember.count()

  console.log(`  - Organizations created: ${orgsCount}`)
  console.log(`  - Organization members: ${membersCount}`)
}

async function verifyMigration() {
  console.log('\n\nVerifying migration...\n')

  // Check for orphaned records (records without organizationId)
  const checks = [
    { model: 'WhatsappNumber', table: prisma.whatsappNumber },
    { model: 'ContactList', table: prisma.contactList },
    { model: 'Campaign', table: prisma.campaign },
    { model: 'MediaFile', table: prisma.mediaFile },
    { model: 'MessageTemplate', table: prisma.messageTemplate },
    { model: 'Webhook', table: prisma.webhook },
    { model: 'PipelineStage', table: prisma.pipelineStage },
    { model: 'Deal', table: prisma.deal },
    { model: 'DealActivity', table: prisma.dealActivity },
    { model: 'DealTask', table: prisma.dealTask },
  ]

  let hasOrphans = false
  for (const check of checks) {
    const orphanCount = await (check.table as any).count({
      where: { organizationId: null as unknown as undefined },
    })
    if (orphanCount > 0) {
      console.log(`  WARNING: ${check.model} has ${orphanCount} orphaned records`)
      hasOrphans = true
    }
  }

  if (!hasOrphans) {
    console.log('  All records have been migrated successfully!')
  }

  // Check users without organizations
  const usersWithoutOrg = await prisma.user.count({
    where: { organizations: { none: {} } },
  })
  if (usersWithoutOrg > 0) {
    console.log(`  WARNING: ${usersWithoutOrg} users have no organization`)
  } else {
    console.log('  All users have at least one organization!')
  }
}

async function main() {
  try {
    await migrateToMultiTenant()
    await verifyMigration()
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
