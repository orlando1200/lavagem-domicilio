-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "description" TEXT,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
