CREATE TYPE "SearchQueryOrigin" AS ENUM ('DETERMINISTIC', 'AI');

CREATE TABLE "search_queries" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "query" VARCHAR(300) NOT NULL,
    "normalized" VARCHAR(300) NOT NULL,
    "origin" "SearchQueryOrigin" NOT NULL,
    "ai_model" VARCHAR(160),
    "ai_request_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "search_queries_profile_id_normalized_key"
ON "search_queries"("profile_id", "normalized");

CREATE INDEX "search_queries_profile_id_created_at_idx"
ON "search_queries"("profile_id", "created_at");

ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
