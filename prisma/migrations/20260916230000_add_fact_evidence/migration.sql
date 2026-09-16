ALTER TABLE "professional_facts"
ADD COLUMN "evidence_quote" TEXT,
ADD COLUMN "ai_model" VARCHAR(160),
ADD COLUMN "ai_request_id" VARCHAR(255);

ALTER TABLE "professional_facts"
DROP CONSTRAINT "professional_facts_source_resume_id_fkey";

ALTER TABLE "professional_facts"
ADD CONSTRAINT "professional_facts_source_resume_id_fkey"
FOREIGN KEY ("source_resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_facts"
ADD CONSTRAINT "professional_facts_pending_evidence_check"
CHECK ("review_status" <> 'PENDING' OR ("source_resume_id" IS NOT NULL AND "evidence_quote" IS NOT NULL));
