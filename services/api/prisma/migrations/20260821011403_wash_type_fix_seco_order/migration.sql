-- A migracao anterior (wash_type_add_seco) usou `ALTER TYPE ... ADD VALUE`
-- sem `BEFORE`, entao o Postgres colocou SECO no final do enum em vez do
-- inicio (Postgres nao suporta reordenar um enum existente in-place —
-- so da pra recriar o tipo do zero com a ordem certa).
BEGIN;
ALTER TYPE "WashType" RENAME TO "WashType_old";
CREATE TYPE "WashType" AS ENUM ('SECO', 'EXPRESSA', 'COMPLETA', 'HIGIENIZACAO_INTERNA', 'POLIMENTO');
ALTER TABLE "wash_price_matrix" ALTER COLUMN "wash_type" TYPE "WashType" USING ("wash_type"::text::"WashType");
DROP TYPE "WashType_old";
COMMIT;
