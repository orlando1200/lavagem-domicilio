-- Migration: add_auctions_and_driver_profiles
-- 1) Renomeia o model `Driver` para `DriverProfile` (introduz PK propria `id`,
--    mantendo `user_id` como coluna unica) e adiciona os campos necessarios
--    para o leilao de servicos pesados: driver_type, allowed_services,
--    total_orders.
-- 2) Cria os models `Auction` / `AuctionBid` (leilao de servicos pesados:
--    cliente cria o leilao a partir de um pedido existente, tenants do tipo
--    CARWASH_SHOP enviam pujas, cliente aceita a vencedora).
-- 3) Cria o model `LoyaltyPoint` (pontos de fidelidade por pedido).
-- Ver docs/FASE9_CORRUPTED_MODULES.md — o schema recuperado ainda usava o
-- model `Driver` original; esta migration destrava o `prisma generate`
-- (o schema.prisma ja havia sido editado para `DriverProfile`/`Auction` em
-- uma rodada anterior sem a migration correspondente).

-- ────────────────────────────────────────────────────────────────────────
-- DRIVER -> DRIVER_PROFILE
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE "drivers" RENAME TO "driver_profiles";
ALTER TABLE "driver_profiles" RENAME CONSTRAINT "drivers_pkey" TO "driver_profiles_user_id_pkey";
ALTER TABLE "driver_profiles" RENAME CONSTRAINT "drivers_user_id_fkey" TO "driver_profiles_user_id_fkey";
ALTER TABLE "driver_profiles" RENAME CONSTRAINT "drivers_current_zone_id_fkey" TO "driver_profiles_current_zone_id_fkey";

CREATE TYPE "DriverType" AS ENUM ('MOTO_WASHER', 'CAR_WASHER', 'CARWASH_SHOP');
CREATE TYPE "ServiceType" AS ENUM ('DRY_WASH', 'EXPRESS_WASH', 'HEAVY_SERVICE');

ALTER TABLE "driver_profiles"
    ADD COLUMN "id" UUID,
    ADD COLUMN "driver_type" "DriverType" NOT NULL DEFAULT 'CAR_WASHER',
    ADD COLUMN "allowed_services" "ServiceType"[] NOT NULL DEFAULT ARRAY[]::"ServiceType"[],
    ADD COLUMN "total_orders" INTEGER NOT NULL DEFAULT 0;

-- Backfill de "id" para linhas existentes (aplicacao gera o id no client
-- para linhas novas via Prisma `@default(uuid())`; aqui e apenas para
-- registros criados antes desta migration).
UPDATE "driver_profiles" SET "id" = gen_random_uuid() WHERE "id" IS NULL;

ALTER TABLE "driver_profiles" ALTER COLUMN "id" SET NOT NULL;

-- Troca a PK de user_id para id. O DROP CASCADE remove tambem as FKs de
-- orders/rentals que apontavam para a antiga PK (drivers.user_id) —
-- recriadas logo em seguida apontando para a nova UNIQUE em user_id.
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_key" UNIQUE ("user_id");
ALTER TABLE "driver_profiles" DROP CONSTRAINT "driver_profiles_user_id_pkey" CASCADE;
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id");

-- DriverProfile.userId -> User.id (recriada com o novo nome de tabela)
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("user_id") ON UPDATE CASCADE;

ALTER TABLE "rentals" ADD CONSTRAINT "rentals_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("user_id") ON UPDATE CASCADE;

-- ────────────────────────────────────────────────────────────────────────
-- AUCTIONS (leilao de servicos pesados)
-- ────────────────────────────────────────────────────────────────────────

CREATE TYPE "AuctionStatus" AS ENUM ('open', 'closed', 'cancelled', 'expired');
CREATE TYPE "BidStatus" AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE "auctions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "service_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "vehicle_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'open',
    "max_budget" DECIMAL(12,2),
    "deadline_hours" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "closed_at" TIMESTAMPTZ,
    "winning_bid_id" UUID,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auctions_order_id_key" ON "auctions"("order_id");
CREATE UNIQUE INDEX "auctions_winning_bid_id_key" ON "auctions"("winning_bid_id");
CREATE INDEX "auctions_status_idx" ON "auctions"("status");

CREATE TABLE "auction_bids" (
    "id" UUID NOT NULL,
    "auction_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "duration_hours" INTEGER NOT NULL,
    "warranty_days" INTEGER NOT NULL,
    "message" TEXT,
    "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "BidStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "auction_bids_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auction_bids_auction_id_idx" ON "auction_bids"("auction_id");
CREATE INDEX "auction_bids_supplier_id_idx" ON "auction_bids"("supplier_id");

-- Auction.orderId -> Order.id
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Auction.winningBidId -> AuctionBid.id
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winning_bid_id_fkey"
    FOREIGN KEY ("winning_bid_id") REFERENCES "auction_bids"("id") ON UPDATE CASCADE;

-- AuctionBid.auctionId -> Auction.id
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_auction_id_fkey"
    FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AuctionBid.supplierId -> DriverProfile.id
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "driver_profiles"("id") ON UPDATE CASCADE;

-- ────────────────────────────────────────────────────────────────────────
-- LOYALTY POINTS
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE "loyalty_points" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "amount" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "loyalty_points_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loyalty_points_user_id_idx" ON "loyalty_points"("user_id");
CREATE INDEX "loyalty_points_expires_at_idx" ON "loyalty_points"("expires_at");

-- LoyaltyPoint.userId -> User.id
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LoyaltyPoint.orderId -> Order.id
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
