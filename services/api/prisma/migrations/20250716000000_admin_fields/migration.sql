-- AlterTable: ServiceCategory
-- Adds icon, sort_order and ensures slug exists for admin categories CRUD.
-- These fields are optional or have defaults, so existing rows keep working.
ALTER TABLE "service_categories"
  ADD COLUMN IF NOT EXISTS "icon" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "slug" VARCHAR(120);

-- Backfill slug for existing rows that may not have it yet, then enforce uniqueness.
UPDATE "service_categories"
  SET "slug" = COALESCE("slug", LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g')))
  WHERE "slug" IS NULL;

ALTER TABLE "service_categories"
  ADD CONSTRAINT "service_categories_slug_key" UNIQUE ("slug");

-- AlterTable: CoverageZone
-- Adds neighborhoods array used by the admin zones page.
ALTER TABLE "coverage_zones"
  ADD COLUMN IF NOT EXISTS "neighborhoods" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ensure existing rows have an empty array instead of NULL.
UPDATE "coverage_zones"
  SET "neighborhoods" = ARRAY[]::TEXT[]
  WHERE "neighborhoods" IS NULL;

ALTER TABLE "coverage_zones"
  ALTER COLUMN "neighborhoods" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "neighborhoods" SET NOT NULL;

