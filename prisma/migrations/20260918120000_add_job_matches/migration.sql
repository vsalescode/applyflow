CREATE TYPE "MatchClassification" AS ENUM ('HOT', 'WARM', 'COLD');

CREATE TABLE "job_matches" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "classification" "MatchClassification" NOT NULL,
    "evaluated_weight" INTEGER NOT NULL,
    "matched_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "breakdown" JSONB NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "calculated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_matches_job_id_key" ON "job_matches"("job_id");
CREATE INDEX "job_matches_classification_score_idx" ON "job_matches"("classification", "score");

ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_id_fkey"
FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
