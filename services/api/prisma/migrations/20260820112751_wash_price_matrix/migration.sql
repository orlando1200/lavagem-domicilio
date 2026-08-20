-- CreateEnum
CREATE TYPE "CarSize" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "WashType" AS ENUM ('EXPRESSA', 'COMPLETA', 'HIGIENIZACAO_INTERNA', 'POLIMENTO');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "size" "CarSize";

-- CreateTable
CREATE TABLE "wash_price_matrix" (
    "id" UUID NOT NULL,
    "car_size" "CarSize" NOT NULL,
    "wash_type" "WashType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wash_price_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wash_price_matrix_car_size_wash_type_key" ON "wash_price_matrix"("car_size", "wash_type");
