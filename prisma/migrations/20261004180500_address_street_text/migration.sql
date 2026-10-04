ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "streetText" TEXT;

UPDATE "addresses"
SET "streetText" = NULLIF(BTRIM(SPLIT_PART("originalInput", ' | ', 1)), '')
WHERE "streetText" IS NULL
  AND "addressType" = 'URBAN'
  AND "originalInput" IS NOT NULL;
