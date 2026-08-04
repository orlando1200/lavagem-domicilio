-- Migration: add_loyalty_redemptions
-- Suporte a resgate parcial de pontos GIUCAR (modulo `loyalty`):
-- 1) `loyalty_points.redeemed_amount` acumula quanto de cada concessao ja
--    foi consumido por resgates, permitindo consumo parcial.
-- 2) `loyalty_redemptions` registra o total resgatado por pedido (no
--    maximo um resgate por pedido).

ALTER TABLE "loyalty_points" ADD COLUMN "redeemed_amount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "loyalty_redemptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "loyalty_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loyalty_redemptions_order_id_key" ON "loyalty_redemptions"("order_id");
CREATE INDEX "loyalty_redemptions_user_id_idx" ON "loyalty_redemptions"("user_id");

ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
