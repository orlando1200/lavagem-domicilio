/*
  Warnings:

  - You are about to drop the column `vehicle_plate` on the `driver_profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "auction_bids" DROP CONSTRAINT "auction_bids_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "auctions" DROP CONSTRAINT "auctions_winning_bid_id_fkey";

-- DropForeignKey
ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "coupon_redemptions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "driver_profiles" DROP CONSTRAINT "driver_profiles_current_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_address_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_coupon_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payouts" DROP CONSTRAINT "payouts_recipient_store_id_fkey";

-- DropForeignKey
ALTER TABLE "payouts" DROP CONSTRAINT "payouts_recipient_washer_id_fkey";

-- DropForeignKey
ALTER TABLE "product_order_items" DROP CONSTRAINT "product_order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_orders" DROP CONSTRAINT "product_orders_buyer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "product_orders" DROP CONSTRAINT "product_orders_buyer_washer_id_fkey";

-- DropForeignKey
ALTER TABLE "product_orders" DROP CONSTRAINT "product_orders_delivery_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "product_orders" DROP CONSTRAINT "product_orders_store_id_fkey";

-- DropForeignKey
ALTER TABLE "rentals" DROP CONSTRAINT "rentals_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_author_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_target_user_id_fkey";

-- DropIndex
DROP INDEX "auction_bids_auction_id_idx";

-- DropIndex
DROP INDEX "auction_bids_supplier_id_idx";

-- DropIndex
DROP INDEX "auctions_status_idx";

-- AlterTable
ALTER TABLE "auction_bids" ALTER COLUMN "photos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "auctions" ALTER COLUMN "service_ids" DROP DEFAULT;

-- AlterTable
ALTER TABLE "driver_profiles" DROP COLUMN "vehicle_plate",
ADD COLUMN     "account_number" TEXT,
ADD COLUMN     "agency" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "pix_key" TEXT,
ADD COLUMN     "pix_key_type" TEXT,
ALTER COLUMN "allowed_services" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_current_zone_id_fkey" FOREIGN KEY ("current_zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_buyer_washer_id_fkey" FOREIGN KEY ("buyer_washer_id") REFERENCES "driver_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_delivery_driver_id_fkey" FOREIGN KEY ("delivery_driver_id") REFERENCES "driver_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_order_items" ADD CONSTRAINT "product_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recipient_washer_id_fkey" FOREIGN KEY ("recipient_washer_id") REFERENCES "driver_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recipient_store_id_fkey" FOREIGN KEY ("recipient_store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "coupon_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winning_bid_id_fkey" FOREIGN KEY ("winning_bid_id") REFERENCES "auction_bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "driver_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "analytics_events_eventName_idx" RENAME TO "analytics_events_event_name_idx";
