-- Migration: add_payouts
-- Adiciona o model Payout (repasses para lavador e lojista), que nao
-- existia no schema original recuperado nem na migration inicial
-- (`20260723000000_init_unified_schema`). Ver docs/FASE9_CORRUPTED_MODULES.md
-- (Phase B - recuperacao do modulo `payouts`).

CREATE TYPE "PayoutRecipientType" AS ENUM ('WASHER', 'STORE');

CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'approved', 'paid', 'rejected');

CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "recipient_type" "PayoutRecipientType" NOT NULL,
    "recipient_washer_id" UUID,
    "recipient_store_id" UUID,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "provider_reference" VARCHAR(120),
    "approved_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payouts_recipient_washer_id_idx" ON "payouts"("recipient_washer_id");

CREATE INDEX "payouts_recipient_store_id_idx" ON "payouts"("recipient_store_id");

CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- Payout.recipientWasherId -> Washer.userId
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recipient_washer_id_fkey"
    FOREIGN KEY ("recipient_washer_id") REFERENCES "washers"("user_id") ON UPDATE CASCADE;

-- Payout.recipientStoreId -> Store.id
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recipient_store_id_fkey"
    FOREIGN KEY ("recipient_store_id") REFERENCES "stores"("id") ON UPDATE CASCADE;
