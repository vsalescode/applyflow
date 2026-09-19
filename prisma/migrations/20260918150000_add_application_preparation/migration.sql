CREATE TYPE "ResumeLanguage" AS ENUM ('PT_BR', 'EN');

CREATE TABLE "application_preparations" (
  "id" UUID NOT NULL,
  "application_id" UUID NOT NULL,
  "language" "ResumeLanguage" NOT NULL,
  "content" JSONB NOT NULL,
  "ai_model" VARCHAR(160) NOT NULL,
  "ai_request_id" VARCHAR(255),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "application_preparations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "application_preparations_application_id_key"
ON "application_preparations"("application_id");

ALTER TABLE "application_preparations"
ADD CONSTRAINT "application_preparations_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
