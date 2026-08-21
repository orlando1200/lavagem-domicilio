-- CreateEnum
CREATE TYPE "FiscalDebtType" AS ENUM ('IPVA', 'MULTA', 'LICENCIAMENTO');

-- CreateEnum
CREATE TYPE "FiscalDebtStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "vehicle_fiscal_debts" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "type" "FiscalDebtType" NOT NULL,
    "external_reference" VARCHAR(60) NOT NULL,
    "description" VARCHAR(160) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" DATE,
    "status" "FiscalDebtStatus" NOT NULL DEFAULT 'PENDING',
    "last_checked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicle_fiscal_debts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_fiscal_debts_vehicle_id_external_reference_key" ON "vehicle_fiscal_debts"("vehicle_id", "external_reference");

-- AddForeignKey
ALTER TABLE "vehicle_fiscal_debts" ADD CONSTRAINT "vehicle_fiscal_debts_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
