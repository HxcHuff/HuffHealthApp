-- CreateEnum
CREATE TYPE "LeadEventType" AS ENUM ('CREATED', 'SMS_SENT', 'EMAIL_SENT', 'CAPI_SENT', 'DUPLICATE_SUBMISSION', 'STAGE_CHANGED', 'NOTE');

-- AlterTable: add ingest fields to Lead
ALTER TABLE "Lead" ADD COLUMN "householdSize" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "estimatedIncome" DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN "qualifyingEvent" TEXT;
ALTER TABLE "Lead" ADD COLUMN "campaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "Lead" ADD COLUMN "tcpaConsent" BOOLEAN;
ALTER TABLE "Lead" ADD COLUMN "tcpaConsentText" TEXT;
ALTER TABLE "Lead" ADD COLUMN "tcpaTimestamp" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Lead" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lastTouchAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");
CREATE INDEX "LeadEvent_type_idx" ON "LeadEvent"("type");
CREATE INDEX "LeadEvent_createdAt_idx" ON "LeadEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
