-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "catalog_year_id" UUID;

-- CreateTable
CREATE TABLE "vehicle_brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(90) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_catalog_models" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_catalog_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_catalog_years" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_catalog_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_fitments" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "universal" BOOLEAN NOT NULL DEFAULT false,
    "brand_id" UUID,
    "model_id" UUID,
    "year_from" INTEGER,
    "year_to" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_fitments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brands_name_key" ON "vehicle_brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brands_slug_key" ON "vehicle_brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_catalog_models_brand_id_name_key" ON "vehicle_catalog_models"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_catalog_years_model_id_year_key" ON "vehicle_catalog_years"("model_id", "year");

-- CreateIndex
CREATE INDEX "product_fitments_product_id_idx" ON "product_fitments"("product_id");

-- CreateIndex
CREATE INDEX "product_fitments_brand_id_model_id_idx" ON "product_fitments"("brand_id", "model_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_catalog_year_id_fkey" FOREIGN KEY ("catalog_year_id") REFERENCES "vehicle_catalog_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_catalog_models" ADD CONSTRAINT "vehicle_catalog_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "vehicle_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_catalog_years" ADD CONSTRAINT "vehicle_catalog_years_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_catalog_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fitments" ADD CONSTRAINT "product_fitments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fitments" ADD CONSTRAINT "product_fitments_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "vehicle_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fitments" ADD CONSTRAINT "product_fitments_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_catalog_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
