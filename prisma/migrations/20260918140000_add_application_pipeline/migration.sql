CREATE TYPE "ApplicationStatus" AS ENUM (
  'FOUND', 'INTERESTING', 'RESUME_PREPARED', 'APPLIED',
  'INTERVIEW', 'OFFER', 'REJECTED', 'ARCHIVED'
);

CREATE TABLE "applications" (
  "id" UUID NOT NULL,
  "job_id" UUID NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'FOUND',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "application_status_events" (
  "id" UUID NOT NULL,
  "application_id" UUID NOT NULL,
  "from_status" "ApplicationStatus" NOT NULL,
  "to_status" "ApplicationStatus" NOT NULL,
  "changed_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "application_status_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "applications_job_id_key" ON "applications"("job_id");
CREATE INDEX "applications_status_updated_at_idx" ON "applications"("status", "updated_at");
CREATE INDEX "application_status_events_application_id_changed_at_idx"
ON "application_status_events"("application_id", "changed_at");

ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey"
FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "application_status_events" ADD CONSTRAINT "application_status_events_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
