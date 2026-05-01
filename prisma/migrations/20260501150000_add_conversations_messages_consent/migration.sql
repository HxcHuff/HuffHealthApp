-- CreateEnum
CREATE TYPE "ConversationChannel" AS ENUM ('SMS', 'WHATSAPP', 'WEBCHAT');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'UNDELIVERED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TCPA_EXPRESS_WRITTEN', 'CMS_SOA', 'MARKETING_OPT_IN', 'INBOUND_INITIATED');

-- CreateEnum
CREATE TYPE "ConsentMethod" AS ENUM ('WEB_FORM', 'VERBAL_RECORDED', 'WRITTEN_SIGNATURE', 'ELECTRONIC', 'INBOUND_INITIATED');

-- AlterEnum
ALTER TYPE "LeadEventType" ADD VALUE 'CONVERSATION_STARTED';
ALTER TYPE "LeadEventType" ADD VALUE 'CONVERSATION_MESSAGE';
ALTER TYPE "LeadEventType" ADD VALUE 'CONSENT_RECORDED';
ALTER TYPE "LeadEventType" ADD VALUE 'CONSENT_REVOKED';

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "twilioConversationSid" TEXT NOT NULL,
    "leadId" TEXT,
    "channel" "ConversationChannel" NOT NULL DEFAULT 'SMS',
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "participantPhone" TEXT,
    "agentIdentity" TEXT,
    "attributes" JSONB,
    "lastMessageAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "twilioMessageSid" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "body" TEXT,
    "mediaUrl" TEXT,
    "mediaUrls" TEXT[],
    "author" TEXT,
    "deliveryStatus" "MessageDeliveryStatus",
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attributes" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT true,
    "consentMethod" "ConsentMethod" NOT NULL,
    "consentText" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_twilioConversationSid_key" ON "Conversation"("twilioConversationSid");

-- CreateIndex
CREATE INDEX "Conversation_twilioConversationSid_idx" ON "Conversation"("twilioConversationSid");

-- CreateIndex
CREATE INDEX "Conversation_leadId_idx" ON "Conversation"("leadId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_channel_idx" ON "Conversation"("channel");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_participantPhone_idx" ON "Conversation"("participantPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Message_twilioMessageSid_key" ON "Message"("twilioMessageSid");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_twilioMessageSid_idx" ON "Message"("twilioMessageSid");

-- CreateIndex
CREATE INDEX "Message_direction_idx" ON "Message"("direction");

-- CreateIndex
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");

-- CreateIndex
CREATE INDEX "Message_deliveryStatus_idx" ON "Message"("deliveryStatus");

-- CreateIndex
CREATE INDEX "ConsentLog_leadId_idx" ON "ConsentLog"("leadId");

-- CreateIndex
CREATE INDEX "ConsentLog_consentType_idx" ON "ConsentLog"("consentType");

-- CreateIndex
CREATE INDEX "ConsentLog_consentedAt_idx" ON "ConsentLog"("consentedAt");

-- CreateIndex
CREATE INDEX "ConsentLog_revokedAt_idx" ON "ConsentLog"("revokedAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
