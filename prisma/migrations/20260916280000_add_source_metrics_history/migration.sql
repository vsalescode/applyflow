CREATE TYPE "SourceKind" AS ENUM ('UNKNOWN', 'ATS', 'CAREER_PAGE', 'AGGREGATOR', 'SPECIALIZED_PORTAL');

ALTER TABLE "sources"
ADD COLUMN "kind" "SourceKind" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "first_seen_at" TIMESTAMPTZ(3),
ADD COLUMN "last_seen_at" TIMESTAMPTZ(3),
ADD COLUMN "occurrence_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "unique_job_count" INTEGER NOT NULL DEFAULT 0;

UPDATE "sources" AS source
SET "first_seen_at" = COALESCE(metrics."first_seen_at", source."created_at"),
    "last_seen_at" = COALESCE(metrics."last_seen_at", source."created_at"),
    "occurrence_count" = COALESCE(metrics."occurrence_count", 0),
    "unique_job_count" = COALESCE(metrics."unique_job_count", 0)
FROM (
  SELECT "source_id", MIN("discovered_at") AS "first_seen_at",
         MAX("discovered_at") AS "last_seen_at", COUNT(*)::INTEGER AS "occurrence_count",
         COUNT(DISTINCT "job_id")::INTEGER AS "unique_job_count"
  FROM "job_occurrences"
  GROUP BY "source_id"
) AS metrics
WHERE metrics."source_id" = source."id";

UPDATE "sources"
SET "first_seen_at" = "created_at", "last_seen_at" = "created_at"
WHERE "first_seen_at" IS NULL OR "last_seen_at" IS NULL;

ALTER TABLE "sources" ALTER COLUMN "first_seen_at" SET NOT NULL;
ALTER TABLE "sources" ALTER COLUMN "first_seen_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sources" ALTER COLUMN "last_seen_at" SET NOT NULL;
ALTER TABLE "sources" ALTER COLUMN "last_seen_at" SET DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "source_metric_snapshots" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "occurrence_count" INTEGER NOT NULL,
    "unique_job_count" INTEGER NOT NULL,
    "observed_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "source_metric_snapshots_pkey" PRIMARY KEY ("id")
);

INSERT INTO "source_metric_snapshots" (
  "id", "source_id", "occurrence_count", "unique_job_count", "observed_at"
)
SELECT gen_random_uuid(), "id", "occurrence_count", "unique_job_count", "last_seen_at"
FROM "sources";

CREATE INDEX "source_metric_snapshots_source_id_observed_at_idx"
ON "source_metric_snapshots"("source_id", "observed_at");

ALTER TABLE "source_metric_snapshots" ADD CONSTRAINT "source_metric_snapshots_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
