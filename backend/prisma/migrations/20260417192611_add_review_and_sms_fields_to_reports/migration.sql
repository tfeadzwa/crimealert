/*
  Warnings:

  - A unique constraint covering the columns `[sms_message_id]` on the table `reports` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "last_status_sms" TIMESTAMP(3),
ADD COLUMN     "notification_phone" TEXT,
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "review_status" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" TEXT,
ADD COLUMN     "sms_message_id" TEXT,
ADD COLUMN     "source_channel" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "reports_sms_message_id_key" ON "reports"("sms_message_id");

-- CreateIndex
CREATE INDEX "reports_source_channel_idx" ON "reports"("source_channel");

-- CreateIndex
CREATE INDEX "reports_review_status_idx" ON "reports"("review_status");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_sms_message_id_fkey" FOREIGN KEY ("sms_message_id") REFERENCES "sms_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
