-- AlterTable: add as nullable first
ALTER TABLE "users" ADD COLUMN "public_id" TEXT;

-- Backfill existing rows with random UUIDs
UPDATE "users" SET "public_id" = gen_random_uuid()::text WHERE "public_id" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "users" ALTER COLUMN "public_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");
