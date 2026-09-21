ALTER TABLE "users" ALTER COLUMN "reviewed_by" SET DATA TYPE TEXT;

-- Convert legacy numeric reviewer IDs to reviewer public IDs
UPDATE "users" AS reviewed_user
SET "reviewed_by" = reviewer."public_id"
FROM "users" AS reviewer
WHERE reviewed_user."reviewed_by" = reviewer."id"::text;

ALTER TABLE "users" ADD CONSTRAINT "users_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("public_id") ON DELETE SET NULL ON UPDATE CASCADE;
