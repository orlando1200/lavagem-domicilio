-- Migration: unify_washer_into_driver_profile
-- `Washer` e `DriverProfile` foram construidos em sessoes diferentes para
-- representar a mesma entidade ("quem lava o carro"); `DriverProfile` e o
-- mais completo (driverType/allowedServices, necessario pro matching por
-- perfil pedido em docs/PRD.md RF-04 e nunca implementado por causa dessa
-- duplicacao). Esta migration remove `Washer` e retarget toda FK que
-- apontava para `washers` -> `driver_profiles`. Tambem adiciona
-- `orders.service_type`, que faltava para o matching poder filtrar por
-- driverType.
--
-- Nao ha Postgres real em uso neste ambiente de desenvolvimento (nenhuma
-- migration anterior foi de fato aplicada a um banco) — nao existe dado
-- real de `Washer` para migrar. Se isto um dia rodar contra um banco com
-- dados reais, revisar/testar em staging antes: o DROP TABLE "washers" e
-- irreversivel.

-- ────────────────────────────────────────────────────────────────────────
-- 1) Order.washerId removido (dropa a FK junto) — matching passa a usar
--    Order.driverId (ja existente, ate aqui usado so pelo modulo `auctions`)
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE "orders" DROP COLUMN "washer_id";

-- ────────────────────────────────────────────────────────────────────────
-- 2) Retarget das FKs que apontavam para `washers` -> `driver_profiles`.
--    Nomes de coluna/constraint mantidos (buyer_washer_id,
--    delivery_driver_id, recipient_washer_id, washer_id em starter_kits)
--    — nenhum consumidor vivo os referencia por nome fora do backend.
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE "product_orders" DROP CONSTRAINT "product_orders_buyer_washer_id_fkey";
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_buyer_washer_id_fkey"
    FOREIGN KEY ("buyer_washer_id") REFERENCES "driver_profiles"("user_id") ON UPDATE CASCADE;

ALTER TABLE "product_orders" DROP CONSTRAINT "product_orders_delivery_driver_id_fkey";
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_delivery_driver_id_fkey"
    FOREIGN KEY ("delivery_driver_id") REFERENCES "driver_profiles"("user_id") ON UPDATE CASCADE;

ALTER TABLE "payouts" DROP CONSTRAINT "payouts_recipient_washer_id_fkey";
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recipient_washer_id_fkey"
    FOREIGN KEY ("recipient_washer_id") REFERENCES "driver_profiles"("user_id") ON UPDATE CASCADE;

ALTER TABLE "starter_kits" DROP CONSTRAINT "starter_kits_washer_id_fkey";
ALTER TABLE "starter_kits" ADD CONSTRAINT "starter_kits_washer_id_fkey"
    FOREIGN KEY ("washer_id") REFERENCES "driver_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ────────────────────────────────────────────────────────────────────────
-- 3) Drop do model Washer (tabela + enum). Nenhuma outra tabela referencia
--    mais `washers` a esta altura da migration.
-- ────────────────────────────────────────────────────────────────────────

DROP TABLE "washers";
DROP TYPE "WasherStatus";

-- ────────────────────────────────────────────────────────────────────────
-- 4) Order.serviceType — habilita matching por driverType (PRD RF-04)
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE "orders" ADD COLUMN "service_type" "ServiceType";
