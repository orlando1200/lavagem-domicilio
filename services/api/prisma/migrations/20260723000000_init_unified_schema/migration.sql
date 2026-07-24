-- Migration: init_unified_schema
-- Reconstructed hand-written migration matching services/api/prisma/schema.prisma
-- Generated 2026-07-23. Prisma normally generates UUIDs client-side for
-- @default(uuid()) fields, so UUID primary keys below have NO DB-side
-- default (NOT NULL only). Enums are created first, then all tables
-- (without foreign keys), then all foreign key constraints are added via
-- ALTER TABLE at the end, mirroring Prisma's own migration generation style.

-- ────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('CLIENTE', 'LAVADOR', 'ADMIN');

CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'blocked', 'pending_verification');

CREATE TYPE "VehicleType" AS ENUM ('carro', 'moto', 'caminhonete', 'van');

CREATE TYPE "DriverStatus" AS ENUM ('draft', 'pending_documents', 'awaiting_kit', 'active', 'inactive', 'rejected', 'blocked');

CREATE TYPE "WasherStatus" AS ENUM ('draft', 'pending_documents', 'active', 'inactive', 'rejected', 'blocked');

CREATE TYPE "OrderStatus" AS ENUM ('pending', 'searching_washer', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled');

CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'pix', 'cash', 'wallet');

CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');

CREATE TYPE "StoreType" AS ENUM ('LAVADOR', 'CLIENTE');

CREATE TYPE "LogisticsPlan" AS ENUM ('INTEGRATED', 'OWN');

CREATE TYPE "StoreStatus" AS ENUM ('pending', 'active', 'inactive', 'blocked');

CREATE TYPE "ProductStatus" AS ENUM ('draft', 'pending_approval', 'active', 'inactive', 'rejected');

CREATE TYPE "CatalogTarget" AS ENUM ('LAVADOR', 'CLIENTE', 'AMBOS');

CREATE TYPE "ProductOrderStatus" AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TYPE "CouponDiscountType" AS ENUM ('percent', 'fixed');

CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TYPE "DocumentVerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE "StarterKitStatus" AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

CREATE TYPE "RentalStatus" AS ENUM ('requested', 'active', 'completed', 'cancelled', 'overdue');

-- ────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────────────────────

-- User
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "avatar_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Address
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(80),
    "street" VARCHAR(200) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "complement" VARCHAR(120),
    "neighborhood" VARCHAR(120) NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zip_code" VARCHAR(12) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- Vehicle
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "VehicleType" NOT NULL,
    "brand" VARCHAR(80) NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "color" VARCHAR(40),
    "plate" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- Driver
CREATE TABLE "drivers" (
    "user_id" UUID NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'draft',
    "vehicle_plate" VARCHAR(10),
    "current_zone_id" UUID,
    "average_rating" DECIMAL(3,2),
    "total_deliveries" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("user_id")
);

-- Washer
CREATE TABLE "washers" (
    "user_id" UUID NOT NULL,
    "status" "WasherStatus" NOT NULL DEFAULT 'draft',
    "service_radius_km" DECIMAL(6,2) NOT NULL DEFAULT 5,
    "current_zone_id" UUID,
    "average_rating" DECIMAL(3,2),
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "washers_pkey" PRIMARY KEY ("user_id")
);

-- Order
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "washer_id" UUID,
    "driver_id" UUID,
    "vehicle_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "zone_id" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- OrderItem
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Payment
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(12,2) NOT NULL,
    "coupon_id" UUID,
    "cashback_used" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "external_ref" VARCHAR(120),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- Store
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "document" VARCHAR(20) NOT NULL,
    "contact_name" VARCHAR(180),
    "email" VARCHAR(180),
    "phone" VARCHAR(20),
    "store_type" "StoreType" NOT NULL,
    "logistics_plan" "LogisticsPlan" NOT NULL DEFAULT 'INTEGRATED',
    "status" "StoreStatus" NOT NULL DEFAULT 'pending',
    "address" JSONB,
    "bank_info" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stores_owner_user_id_key" ON "stores"("owner_user_id");

-- Product
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sku" VARCHAR(60),
    "category" VARCHAR(80),
    "price" DECIMAL(12,2) NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "catalog_target" "CatalogTarget" NOT NULL DEFAULT 'AMBOS',
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMPTZ,
    "approved_by_user_id" UUID,
    "weight_grams" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- ProductOrder
CREATE TABLE "product_orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(30) NOT NULL,
    "buyer_user_id" UUID NOT NULL,
    "buyer_washer_id" UUID,
    "store_id" UUID NOT NULL,
    "status" "ProductOrderStatus" NOT NULL DEFAULT 'pending',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shipping_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "product_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_orders_order_number_key" ON "product_orders"("order_number");

-- ProductOrderItem
CREATE TABLE "product_order_items" (
    "id" UUID NOT NULL,
    "product_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "product_order_items_pkey" PRIMARY KEY ("id")
);

-- CommissionPlan
CREATE TABLE "commission_plans" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "store_type" "StoreType" NOT NULL,
    "logistics_plan" "LogisticsPlan" NOT NULL,
    "monthly_fee" DECIMAL(12,2) NOT NULL,
    "take_rate" DECIMAL(5,4) NOT NULL,
    "minimum_billing" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "commission_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commission_plans_store_id_key" ON "commission_plans"("store_id");

-- Coupon
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "discount_type" "CouponDiscountType" NOT NULL,
    "discount_value" DECIMAL(12,2) NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "min_order_amount" DECIMAL(12,2),
    "expires_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "campaign_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CouponCampaign
CREATE TABLE "coupon_campaigns" (
    "id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "coupon_campaigns_pkey" PRIMARY KEY ("id")
);

-- CouponRedemption
CREATE TABLE "coupon_redemptions" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "redeemed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CashbackBalance
CREATE TABLE "cashback_balances" (
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cashback_balances_pkey" PRIMARY KEY ("user_id")
);

-- LoyaltyCampaign
CREATE TABLE "loyalty_campaigns" (
    "id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "points_per_real" DECIMAL(6,2) NOT NULL DEFAULT 1,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "loyalty_campaigns_pkey" PRIMARY KEY ("id")
);

-- Review
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- SupportTicket
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" VARCHAR(180) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- Zone
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "neighborhoods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "zones_slug_key" ON "zones"("slug");

-- DocumentVerification
CREATE TABLE "document_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "doc_type" VARCHAR(60) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "status" "DocumentVerificationStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_verifications_pkey" PRIMARY KEY ("id")
);

-- FaceCheck
CREATE TABLE "face_checks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "image_url" VARCHAR(500) NOT NULL,
    "match_score" DECIMAL(5,4),
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "face_checks_pkey" PRIMARY KEY ("id")
);

-- StarterKit
CREATE TABLE "starter_kits" (
    "washer_id" UUID NOT NULL,
    "status" "StarterKitStatus" NOT NULL DEFAULT 'pending',
    "price" DECIMAL(12,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "starter_kits_pkey" PRIMARY KEY ("washer_id")
);

-- Rental
CREATE TABLE "rentals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "driver_id" UUID,
    "status" "RentalStatus" NOT NULL DEFAULT 'requested',
    "weekly_rate" DECIMAL(12,2) NOT NULL,
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- AnalyticsEvent
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "event_name" VARCHAR(120) NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_eventName_idx" ON "analytics_events"("event_name");

-- HealthCheck
CREATE TABLE "health_checks" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- ────────────────────────────────────────────────────────────────────────────
-- FOREIGN KEYS
-- ────────────────────────────────────────────────────────────────────────────

-- Address.userId -> User.id (Cascade)
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vehicle.userId -> User.id (Cascade)
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Driver.userId -> User.id (Cascade)
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Driver.currentZoneId -> Zone.id
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_current_zone_id_fkey"
    FOREIGN KEY ("current_zone_id") REFERENCES "zones"("id") ON UPDATE CASCADE;

-- Washer.userId -> User.id (Cascade)
ALTER TABLE "washers" ADD CONSTRAINT "washers_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Washer.currentZoneId -> Zone.id
ALTER TABLE "washers" ADD CONSTRAINT "washers_current_zone_id_fkey"
    FOREIGN KEY ("current_zone_id") REFERENCES "zones"("id") ON UPDATE CASCADE;

-- Order.customerId -> User.id
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- Order.washerId -> Washer.userId
ALTER TABLE "orders" ADD CONSTRAINT "orders_washer_id_fkey"
    FOREIGN KEY ("washer_id") REFERENCES "washers"("user_id") ON UPDATE CASCADE;

-- Order.driverId -> Driver.userId
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "drivers"("user_id") ON UPDATE CASCADE;

-- Order.vehicleId -> Vehicle.id
ALTER TABLE "orders" ADD CONSTRAINT "orders_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON UPDATE CASCADE;

-- Order.addressId -> Address.id
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey"
    FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON UPDATE CASCADE;

-- Order.zoneId -> Zone.id
ALTER TABLE "orders" ADD CONSTRAINT "orders_zone_id_fkey"
    FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON UPDATE CASCADE;

-- OrderItem.orderId -> Order.id (Cascade)
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payment.orderId -> Order.id (Cascade)
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payment.userId -> User.id
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- Payment.couponId -> Coupon.id
ALTER TABLE "payments" ADD CONSTRAINT "payments_coupon_id_fkey"
    FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON UPDATE CASCADE;

-- Store.ownerUserId -> User.id (Cascade)
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product.storeId -> Store.id (Cascade)
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProductOrder.buyerUserId -> User.id
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_buyer_user_id_fkey"
    FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- ProductOrder.buyerWasherId -> Washer.userId
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_buyer_washer_id_fkey"
    FOREIGN KEY ("buyer_washer_id") REFERENCES "washers"("user_id") ON UPDATE CASCADE;

-- ProductOrder.storeId -> Store.id
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON UPDATE CASCADE;

-- ProductOrderItem.productOrderId -> ProductOrder.id (Cascade)
ALTER TABLE "product_order_items" ADD CONSTRAINT "product_order_items_product_order_id_fkey"
    FOREIGN KEY ("product_order_id") REFERENCES "product_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProductOrderItem.productId -> Product.id
ALTER TABLE "product_order_items" ADD CONSTRAINT "product_order_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE;

-- CommissionPlan.storeId -> Store.id (Cascade)
ALTER TABLE "commission_plans" ADD CONSTRAINT "commission_plans_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Coupon.campaignId -> CouponCampaign.id
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "coupon_campaigns"("id") ON UPDATE CASCADE;

-- CouponRedemption.couponId -> Coupon.id (Cascade)
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey"
    FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CouponRedemption.userId -> User.id
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- CashbackBalance.userId -> User.id (Cascade)
ALTER TABLE "cashback_balances" ADD CONSTRAINT "cashback_balances_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review.orderId -> Order.id (Cascade)
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review.authorUserId -> User.id
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_fkey"
    FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- Review.targetUserId -> User.id
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_user_id_fkey"
    FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- SupportTicket.userId -> User.id (Cascade)
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DocumentVerification.userId -> User.id (Cascade)
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FaceCheck.userId -> User.id (Cascade)
ALTER TABLE "face_checks" ADD CONSTRAINT "face_checks_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StarterKit.washerId -> Washer.userId (Cascade)
ALTER TABLE "starter_kits" ADD CONSTRAINT "starter_kits_washer_id_fkey"
    FOREIGN KEY ("washer_id") REFERENCES "washers"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rental.userId -> User.id (Cascade)
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rental.driverId -> Driver.userId
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "drivers"("user_id") ON UPDATE CASCADE;

-- AnalyticsEvent.userId -> User.id (SetNull)
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
