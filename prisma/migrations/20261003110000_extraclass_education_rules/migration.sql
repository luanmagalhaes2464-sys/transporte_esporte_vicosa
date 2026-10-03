-- Align extracurricular transport requests with the operational form used by Education.
DO $$ BEGIN
  CREATE TYPE "ExtraShift" AS ENUM ('MORNING', 'AFTERNOON');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "extracurricular_requests"
  ADD COLUMN IF NOT EXISTS "shift" "ExtraShift",
  ADD COLUMN IF NOT EXISTS "directorName" TEXT,
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
