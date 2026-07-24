-- Migration: add_product_order_deliveries
-- Adiciona suporte a ENTREGAS de produtos da Loja do Lavador, reaproveitando
-- o model `ProductOrder` existente em vez de criar um model novo: uma
-- entrega e sempre a logistica de um pedido de produto ja existente
-- (insumos/equipamentos comprados por um lavador na Loja do Lavador).
--
-- Novo enum `ProductOrderDeliveryStatus` (fluxo logistico, distinto do
-- `ProductOrderStatus` comercial) + campos `delivery_status`,
-- `delivery_driver_id`, `assigned_at`, `delivered_at` em `product_orders`.

CREATE TYPE "ProductOrderDeliveryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');

ALTER TABLE "product_orders" ADD COLUMN "delivery_status" "ProductOrderDeliveryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "product_orders" ADD COLUMN "delivery_driver_id" UUID;
ALTER TABLE "product_orders" ADD COLUMN "assigned_at" TIMESTAMPTZ;
ALTER TABLE "product_orders" ADD COLUMN "delivered_at" TIMESTAMPTZ;

CREATE INDEX "product_orders_delivery_status_idx" ON "product_orders"("delivery_status");

CREATE INDEX "product_orders_delivery_driver_id_idx" ON "product_orders"("delivery_driver_id");

-- ProductOrder.deliveryDriverId -> Washer.userId
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_delivery_driver_id_fkey"
    FOREIGN KEY ("delivery_driver_id") REFERENCES "washers"("user_id") ON UPDATE CASCADE;
