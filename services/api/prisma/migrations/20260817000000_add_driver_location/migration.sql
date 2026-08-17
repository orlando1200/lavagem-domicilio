-- AlterTable
ALTER TABLE "driver_profiles"
  ADD COLUMN "current_latitude" DECIMAL(10,7),
  ADD COLUMN "current_longitude" DECIMAL(10,7),
  ADD COLUMN "location_updated_at" TIMESTAMPTZ;
