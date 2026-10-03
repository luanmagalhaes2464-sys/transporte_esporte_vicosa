-- One active residential address per person.
-- Keep the most recently updated/saved address active and preserve older rows as history.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "personId"
           ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
         ) AS rn
  FROM addresses
  WHERE "personId" IS NOT NULL AND active = true
)
UPDATE addresses a
SET active = false
FROM ranked r
WHERE a.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "addresses_one_active_per_person"
ON addresses ("personId")
WHERE active = true AND "personId" IS NOT NULL;
