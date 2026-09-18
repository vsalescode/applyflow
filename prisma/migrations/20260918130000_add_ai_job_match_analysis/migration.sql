ALTER TABLE "job_matches"
ADD COLUMN "ai_analysis" JSONB,
ADD COLUMN "ai_model" VARCHAR(160),
ADD COLUMN "ai_request_id" VARCHAR(255),
ADD COLUMN "ai_analyzed_at" TIMESTAMPTZ(3);
