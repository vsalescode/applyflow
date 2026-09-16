CREATE TYPE "WorkArrangement" AS ENUM ('UNKNOWN', 'REMOTE', 'HYBRID', 'ONSITE');

CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "domain" VARCHAR(253) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "search_query_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "company" VARCHAR(200),
    "description" TEXT,
    "location" VARCHAR(200),
    "work_arrangement" "WorkArrangement" NOT NULL DEFAULT 'UNKNOWN',
    "url" VARCHAR(2048) NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "published_label" VARCHAR(100),
    "discovered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sources_provider_domain_key" ON "sources"("provider", "domain");
CREATE INDEX "jobs_search_query_id_discovered_at_idx" ON "jobs"("search_query_id", "discovered_at");
CREATE INDEX "jobs_source_id_idx" ON "jobs"("source_id");

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_search_query_id_fkey"
FOREIGN KEY ("search_query_id") REFERENCES "search_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
