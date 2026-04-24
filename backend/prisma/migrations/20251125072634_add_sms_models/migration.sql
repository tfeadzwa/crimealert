-- CreateTable
CREATE TABLE "gateway_clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_messages" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "sender" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "rawPayload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outgoing_sms_instructions" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "platform_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),

    CONSTRAINT "outgoing_sms_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gateway_clients_api_key_key" ON "gateway_clients"("api_key");

-- CreateIndex
CREATE INDEX "gateway_clients_api_key_idx" ON "gateway_clients"("api_key");

-- CreateIndex
CREATE INDEX "sms_messages_sender_idx" ON "sms_messages"("sender");

-- CreateIndex
CREATE INDEX "sms_messages_processed_idx" ON "sms_messages"("processed");

-- CreateIndex
CREATE INDEX "outgoing_sms_instructions_status_idx" ON "outgoing_sms_instructions"("status");
