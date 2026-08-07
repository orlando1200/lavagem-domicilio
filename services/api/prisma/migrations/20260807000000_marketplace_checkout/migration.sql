-- Migration: marketplace_checkout
-- Suporte ao checkout real da loja do cliente (modulo `marketplace`):
-- 1) `product_orders.shipping_address` guarda um snapshot JSON do
--    endereco de entrega informado no checkout (mesma estrategia de
--    `stores.address`, sem tabela relacional nova — decisao de escopo:
--    nao criar um modulo de endereco).
-- 2) `payments` passa a poder referenciar OU um `Order` (servico de
--    lavagem) OU um `ProductOrder` (compra na loja), nunca os dois nem
--    nenhum — `payments.order_id` vira opcional, novo
--    `payments.product_order_id` opcional e unico (1:1, como ja era
--    `order_id`), e um CHECK garante a exclusividade mutua.
--
-- Nao ha Postgres real em uso neste ambiente (nenhuma migration anterior
-- foi de fato aplicada) — sem dados reais de `payments`/`product_orders`
-- para migrar.

-- ────────────────────────────────────────────────────────────────────────
-- 1) ProductOrder.shippingAddress
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE "product_orders" ADD COLUMN "shipping_address" JSONB;

-- ────────────────────────────────────────────────────────────────────────
-- 2) Payment: orderId opcional + productOrderId novo (opcional, unico)
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE "payments" ALTER COLUMN "order_id" DROP NOT NULL;

ALTER TABLE "payments" ADD COLUMN "product_order_id" UUID;

CREATE UNIQUE INDEX "payments_product_order_id_key" ON "payments"("product_order_id");

ALTER TABLE "payments" ADD CONSTRAINT "payments_product_order_id_fkey"
    FOREIGN KEY ("product_order_id") REFERENCES "product_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Garante que todo pagamento referencia exatamente um dos dois pedidos
-- (nunca os dois, nunca nenhum).
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_xor_product_order_check"
    CHECK (
        ("order_id" IS NOT NULL AND "product_order_id" IS NULL)
        OR ("order_id" IS NULL AND "product_order_id" IS NOT NULL)
    );
