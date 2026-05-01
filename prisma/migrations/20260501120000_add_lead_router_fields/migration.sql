-- New enums for the lead router / CRM pipeline
CREATE TYPE "LeadPriority" AS ENUM ('HOT', 'WARM', 'COLD');
CREATE TYPE "LeadSourceCategory" AS ENUM ('PAID', 'ORGANIC', 'REFERRAL', 'DIRECT', 'OTHER');

-- New LeadEvent types for router observability
ALTER TYPE "LeadEventType" ADD VALUE IF NOT EXISTS 'ROUTED';
ALTER TYPE "LeadEventType" ADD VALUE IF NOT EXISTS 'ADMIN_NOTIFIED';
ALTER TYPE "LeadEventType" ADD VALUE IF NOT EXISTS 'WEBHOOK_DISPATCHED';

-- Lead pipeline columns
ALTER TABLE "Lead"
  ADD COLUMN "priority" "LeadPriority" NOT NULL DEFAULT 'COLD',
  ADD COLUMN "sourceCategory" "LeadSourceCategory",
  ADD COLUMN "routedAt" TIMESTAMP(3),
  ADD COLUMN "speedToLeadAt" TIMESTAMP(3);

CREATE INDEX "Lead_priority_idx" ON "Lead"("priority");
CREATE INDEX "Lead_sourceCategory_idx" ON "Lead"("sourceCategory");
