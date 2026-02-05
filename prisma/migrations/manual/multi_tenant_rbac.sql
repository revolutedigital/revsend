-- Multi-Tenant RBAC Migration
-- Run this migration in two phases:
-- 1. Add nullable columns
-- 2. Run migrate-to-multi-tenant.ts script
-- 3. Make columns NOT NULL

-- ============================================
-- PHASE 1: Add new columns and tables (nullable)
-- ============================================

-- User: Add isMaster flag
ALTER TABLE "users" ADD COLUMN "is_master" BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- New Tables
-- ============================================

-- Organization Invites
CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'vendedor',
    "invited_by_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

-- Notifications
CREATE TABLE "notifications" (
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

-- Tags
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- Contact Tags
CREATE TABLE "contact_tags" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("id")
);

-- Lead Roulette Config
CREATE TABLE "lead_roulette_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "strategy" TEXT NOT NULL DEFAULT 'weighted_round_robin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_roulette_configs_pkey" PRIMARY KEY ("id")
);

-- Lead Roulette Weights
CREATE TABLE "lead_roulette_weights" (
    "id" TEXT NOT NULL,
    "roulette_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_assigned_at" TIMESTAMP(3),
    "assign_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lead_roulette_weights_pkey" PRIMARY KEY ("id")
);

-- Blacklist Keywords
CREATE TABLE "blacklist_keywords" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_keywords_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Add organizationId columns (nullable first)
-- ============================================

ALTER TABLE "whatsapp_numbers" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "contact_lists" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "media_files" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "message_templates" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "webhooks" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "pipeline_stages" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "deals" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "deals" ADD COLUMN "assigned_to_id" TEXT;
ALTER TABLE "deal_activities" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "deal_tasks" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "deal_tasks" ADD COLUMN "assigned_to_id" TEXT;

-- Blacklist and consent changes
ALTER TABLE "blacklist" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "blacklist" ADD COLUMN "keyword" TEXT;
ALTER TABLE "blacklist" DROP CONSTRAINT IF EXISTS "blacklist_phone_number_key";
ALTER TABLE "contact_consents" ADD COLUMN "organization_id" TEXT;

-- Contact lead scoring fields
ALTER TABLE "contacts" ADD COLUMN "lead_score" INTEGER DEFAULT 0;
ALTER TABLE "contacts" ADD COLUMN "lead_status" TEXT DEFAULT 'novo';
ALTER TABLE "contacts" ADD COLUMN "scored_at" TIMESTAMP(3);
ALTER TABLE "contacts" ADD COLUMN "score_metadata" JSONB;

-- Update organization_members role default
ALTER TABLE "organization_members" ALTER COLUMN "role" SET DEFAULT 'vendedor';

-- ============================================
-- Create Indexes
-- ============================================

CREATE UNIQUE INDEX "organization_invites_token_key" ON "organization_invites"("token");
CREATE INDEX "organization_invites_token_idx" ON "organization_invites"("token");
CREATE INDEX "organization_invites_organization_id_idx" ON "organization_invites"("organization_id");

CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX "notifications_organization_id_idx" ON "notifications"("organization_id");

CREATE UNIQUE INDEX "tags_organization_id_name_key" ON "tags"("organization_id", "name");
CREATE INDEX "tags_organization_id_idx" ON "tags"("organization_id");

CREATE UNIQUE INDEX "contact_tags_contact_id_tag_id_key" ON "contact_tags"("contact_id", "tag_id");

CREATE UNIQUE INDEX "lead_roulette_configs_organization_id_key" ON "lead_roulette_configs"("organization_id");
CREATE UNIQUE INDEX "lead_roulette_weights_roulette_id_user_id_key" ON "lead_roulette_weights"("roulette_id", "user_id");

CREATE UNIQUE INDEX "blacklist_keywords_organization_id_keyword_key" ON "blacklist_keywords"("organization_id", "keyword");

CREATE UNIQUE INDEX "blacklist_organization_id_phone_number_key" ON "blacklist"("organization_id", "phone_number");
CREATE INDEX "blacklist_organization_id_idx" ON "blacklist"("organization_id");

CREATE INDEX "whatsapp_numbers_organization_id_idx" ON "whatsapp_numbers"("organization_id");
CREATE INDEX "contact_lists_organization_id_idx" ON "contact_lists"("organization_id");
CREATE INDEX "campaigns_organization_id_idx" ON "campaigns"("organization_id");
CREATE INDEX "media_files_organization_id_idx" ON "media_files"("organization_id");
CREATE INDEX "message_templates_organization_id_idx" ON "message_templates"("organization_id");
CREATE INDEX "webhooks_organization_id_idx" ON "webhooks"("organization_id");
CREATE INDEX "pipeline_stages_organization_id_idx" ON "pipeline_stages"("organization_id");
CREATE INDEX "deals_organization_id_idx" ON "deals"("organization_id");
CREATE INDEX "deals_assigned_to_id_idx" ON "deals"("assigned_to_id");
CREATE INDEX "deal_activities_organization_id_idx" ON "deal_activities"("organization_id");
CREATE INDEX "deal_tasks_organization_id_idx" ON "deal_tasks"("organization_id");
CREATE INDEX "deal_tasks_assigned_to_id_idx" ON "deal_tasks"("assigned_to_id");
CREATE INDEX "contacts_lead_status_idx" ON "contacts"("lead_status");
CREATE INDEX "contact_consents_organization_id_idx" ON "contact_consents"("organization_id");
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- ============================================
-- Add Foreign Keys
-- ============================================

ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_by_id_fkey"
    FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_contact_id_fkey"
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_roulette_configs" ADD CONSTRAINT "lead_roulette_configs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_roulette_weights" ADD CONSTRAINT "lead_roulette_weights_roulette_id_fkey"
    FOREIGN KEY ("roulette_id") REFERENCES "lead_roulette_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_roulette_weights" ADD CONSTRAINT "lead_roulette_weights_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blacklist_keywords" ADD CONSTRAINT "blacklist_keywords_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Organization FKs for existing tables
ALTER TABLE "whatsapp_numbers" ADD CONSTRAINT "whatsapp_numbers_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_lists" ADD CONSTRAINT "contact_lists_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deals" ADD CONSTRAINT "deals_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_activities" ADD CONSTRAINT "deal_activities_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_consents" ADD CONSTRAINT "contact_consents_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- PHASE 2: Run migrate-to-multi-tenant.ts
-- npx ts-node prisma/migrations/manual/migrate-to-multi-tenant.ts
-- ============================================

-- ============================================
-- PHASE 3: Make required columns NOT NULL
-- (Run after data migration is complete)
-- ============================================

-- ALTER TABLE "whatsapp_numbers" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "contact_lists" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "campaigns" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "media_files" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "message_templates" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "webhooks" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "pipeline_stages" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "deals" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "deal_activities" ALTER COLUMN "organization_id" SET NOT NULL;
-- ALTER TABLE "deal_tasks" ALTER COLUMN "organization_id" SET NOT NULL;
