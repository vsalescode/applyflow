CREATE TABLE "job_occurrences" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "search_query_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "original_url" VARCHAR(2048) NOT NULL,
    "canonical_url" VARCHAR(2048) NOT NULL,
    "published_label" VARCHAR(100),
    "discovered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_occurrences_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "jobs" ADD COLUMN "profile_id" UUID;
ALTER TABLE "jobs" ADD COLUMN "fingerprint" CHAR(64);

UPDATE "jobs" AS job
SET "profile_id" = query."profile_id",
    "fingerprint" = REPLACE(job."id"::TEXT, '-', '') || REPLACE(job."id"::TEXT, '-', '')
FROM "search_queries" AS query
WHERE query."id" = job."search_query_id";

INSERT INTO "job_occurrences" (
    "id", "job_id", "search_query_id", "source_id", "original_url",
    "canonical_url", "published_label", "discovered_at"
)
SELECT "id", "id", "search_query_id", "source_id", "url", "url",
       "published_label", "discovered_at"
FROM "jobs";

ALTER TABLE "jobs" ALTER COLUMN "profile_id" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "fingerprint" SET NOT NULL;
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_search_query_id_fkey";
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_source_id_fkey";
DROP INDEX "jobs_search_query_id_discovered_at_idx";
DROP INDEX "jobs_source_id_idx";
ALTER TABLE "jobs" DROP COLUMN "search_query_id";
ALTER TABLE "jobs" DROP COLUMN "source_id";
ALTER TABLE "jobs" DROP COLUMN "url";
ALTER TABLE "jobs" DROP COLUMN "published_label";

CREATE UNIQUE INDEX "jobs_profile_id_fingerprint_key" ON "jobs"("profile_id", "fingerprint");
CREATE INDEX "jobs_profile_id_discovered_at_idx" ON "jobs"("profile_id", "discovered_at");
CREATE UNIQUE INDEX "job_occurrences_search_query_id_source_id_canonical_url_key"
ON "job_occurrences"("search_query_id", "source_id", "canonical_url");
CREATE INDEX "job_occurrences_job_id_idx" ON "job_occurrences"("job_id");
CREATE INDEX "job_occurrences_source_id_idx" ON "job_occurrences"("source_id");

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_occurrences" ADD CONSTRAINT "job_occurrences_job_id_fkey"
FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_occurrences" ADD CONSTRAINT "job_occurrences_search_query_id_fkey"
FOREIGN KEY ("search_query_id") REFERENCES "search_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_occurrences" ADD CONSTRAINT "job_occurrences_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
