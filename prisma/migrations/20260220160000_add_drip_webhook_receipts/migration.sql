-- CreateTable
CREATE TABLE "DripWebhookReceipt" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DripWebhookReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DripWebhookReceipt_eventKey_key" ON "DripWebhookReceipt"("eventKey");

-- CreateIndex
CREATE INDEX "DripWebhookReceipt_createdAt_idx" ON "DripWebhookReceipt"("createdAt");
