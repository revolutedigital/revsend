-- Multi-Tenant RBAC Migration
-- Handles existing data by creating default organization

-- ============================================
-- PHASE 1: Add new tables first
-- ============================================

-- Organizations
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug");

-- Organization Members
CREATE TABLE IF NOT EXISTS "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'vendedor',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");
CREATE INDEX IF NOT EXISTS "organization_members_user_id_idx" ON "organization_members"("user_id");

-- Organization Invites
CREATE TABLE IF NOT EXISTS "organization_invites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'vendedor',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invited_by_id" TEXT NOT NULL,
    "accepted_by_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_invites_token_key" ON "organization_invites"("token");
CREATE INDEX IF NOT EXISTS "organization_invites_organization_id_idx" ON "organization_invites"("organization_id");

-- Notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "notifications_organization_id_idx" ON "notifications"("organization_id");

-- Tags
CREATE TABLE IF NOT EXISTS "tags" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_organization_id_name_key" ON "tags"("organization_id", "name");
CREATE INDEX IF NOT EXISTS "tags_organization_id_idx" ON "tags"("organization_id");

-- Contact Tags
CREATE TABLE IF NOT EXISTS "contact_tags" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contact_tags_contact_id_tag_id_key" ON "contact_tags"("contact_id", "tag_id");

-- Lead Roulette Config
CREATE TABLE IF NOT EXISTS "lead_roulette_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "strategy" TEXT NOT NULL DEFAULT 'weighted_round_robin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_roulette_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_roulette_configs_organization_id_key" ON "lead_roulette_configs"("organization_id");

-- Lead Roulette Weights
CREATE TABLE IF NOT EXISTS "lead_roulette_weights" (
    "id" TEXT NOT NULL,
    "roulette_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_assigned_at" TIMESTAMP(3),
    "assign_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "lead_roulette_weights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_roulette_weights_roulette_id_user_id_key" ON "lead_roulette_weights"("roulette_id", "user_id");

-- Blacklist Keywords
CREATE TABLE IF NOT EXISTS "blacklist_keywords" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blacklist_keywords_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blacklist_keywords_organization_id_keyword_key" ON "blacklist_keywords"("organization_id", "keyword");

-- ============================================
-- PHASE 2: Add columns to existing tables
-- ============================================

-- Users: Add is_master flag
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_master" BOOLEAN NOT NULL DEFAULT false;

-- Contacts: Add lead scoring fields
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "lead_score" INTEGER DEFAULT 0;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "lead_status" TEXT DEFAULT 'novo';
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "scored_at" TIMESTAMP(3);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "score_metadata" JSONB;

-- Deals: Add assigned_to_id
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "assigned_to_id" TEXT;

-- Blacklist: Add reason and keyword
ALTER TABLE "blacklist" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "blacklist" ADD COLUMN IF NOT EXISTS "keyword" TEXT;

-- ============================================
-- PHASE 3: Add organization_id as NULLABLE first
-- ============================================

ALTER TABLE "whatsapp_numbers" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "contact_lists" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "message_templates" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "webhooks" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "pipeline_stages" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "deal_activities" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "deal_tasks" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "blacklist" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "contact_consents" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

-- ============================================
-- PHASE 4: Create default organizations for existing users
-- ============================================

-- Create organization for each existing user that doesn't have one
INSERT INTO "organizations" ("id", "name", "slug", "plan", "created_at", "updated_at")
SELECT
    'org_' || u.id,
    COALESCE(u.name, u.email) || '''s Organization',
    LOWER(REPLACE(COALESCE(u.name, SPLIT_PART(u.email, '@', 1)), ' ', '-')) || '-' || SUBSTRING(u.id, 1, 8),
    'free',
    NOW(),
    NOW()
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "organization_members" om WHERE om.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Create membership for each user to their organization
INSERT INTO "organization_members" ("id", "organization_id", "user_id", "role", "created_at")
SELECT
    'mem_' || u.id,
    'org_' || u.id,
    u.id,
    'gerente',
    NOW()
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "organization_members" om WHERE om.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- ============================================
-- PHASE 5: Update existing data with organization_id
-- ============================================

-- Update whatsapp_numbers
UPDATE "whatsapp_numbers" wn
SET "organization_id" = 'org_' || wn."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update contact_lists
UPDATE "contact_lists" cl
SET "organization_id" = 'org_' || cl."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update campaigns
UPDATE "campaigns" c
SET "organization_id" = 'org_' || c."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update media_files
UPDATE "media_files" mf
SET "organization_id" = 'org_' || mf."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update message_templates
UPDATE "message_templates" mt
SET "organization_id" = 'org_' || mt."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update webhooks
UPDATE "webhooks" w
SET "organization_id" = 'org_' || w."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update pipeline_stages
UPDATE "pipeline_stages" ps
SET "organization_id" = 'org_' || ps."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update deals (also set assigned_to_id)
UPDATE "deals" d
SET
    "organization_id" = 'org_' || d."user_id",
    "assigned_to_id" = d."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update deal_activities
UPDATE "deal_activities" da
SET "organization_id" = (
    SELECT d."organization_id" FROM "deals" d WHERE d.id = da."deal_id"
)
WHERE "organization_id" IS NULL;

-- Update deal_tasks
UPDATE "deal_tasks" dt
SET "organization_id" = (
    SELECT d."organization_id" FROM "deals" d WHERE d.id = dt."deal_id"
)
WHERE "organization_id" IS NULL;

-- Update audit_logs
UPDATE "audit_logs" al
SET "organization_id" = 'org_' || al."user_id"
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- Update blacklist
UPDATE "blacklist" b
SET "organization_id" = 'org_' || b."added_by"
WHERE "organization_id" IS NULL AND "added_by" IS NOT NULL;

-- ============================================
-- PHASE 6: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS "whatsapp_numbers_organization_id_idx" ON "whatsapp_numbers"("organization_id");
CREATE INDEX IF NOT EXISTS "contact_lists_organization_id_idx" ON "contact_lists"("organization_id");
CREATE INDEX IF NOT EXISTS "campaigns_organization_id_idx" ON "campaigns"("organization_id");
CREATE INDEX IF NOT EXISTS "media_files_organization_id_idx" ON "media_files"("organization_id");
CREATE INDEX IF NOT EXISTS "message_templates_organization_id_idx" ON "message_templates"("organization_id");
CREATE INDEX IF NOT EXISTS "webhooks_organization_id_idx" ON "webhooks"("organization_id");
CREATE INDEX IF NOT EXISTS "pipeline_stages_organization_id_idx" ON "pipeline_stages"("organization_id");
CREATE INDEX IF NOT EXISTS "deals_organization_id_idx" ON "deals"("organization_id");
CREATE INDEX IF NOT EXISTS "deals_assigned_to_id_idx" ON "deals"("assigned_to_id");
CREATE INDEX IF NOT EXISTS "deal_activities_organization_id_idx" ON "deal_activities"("organization_id");
CREATE INDEX IF NOT EXISTS "deal_tasks_organization_id_idx" ON "deal_tasks"("organization_id");
CREATE INDEX IF NOT EXISTS "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");
CREATE INDEX IF NOT EXISTS "contacts_lead_score_idx" ON "contacts"("lead_score");
CREATE INDEX IF NOT EXISTS "contacts_lead_status_idx" ON "contacts"("lead_status");

-- ============================================
-- PHASE 7: Add foreign key constraints
-- ============================================

ALTER TABLE "organization_members"
ADD CONSTRAINT IF NOT EXISTS "organization_members_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_members"
ADD CONSTRAINT IF NOT EXISTS "organization_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: Making organization_id NOT NULL is deferred to allow gradual migration
-- Run this after verifying all data has been migrated:
-- ALTER TABLE "whatsapp_numbers" ALTER COLUMN "organization_id" SET NOT NULL;
-- etc.
