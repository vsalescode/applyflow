CREATE TYPE "Seniority" AS ENUM ('UNSPECIFIED', 'INTERN', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER', 'EXECUTIVE');
CREATE TYPE "ProfessionalFactType" AS ENUM ('SKILL', 'EXPERIENCE');
CREATE TYPE "FactReviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

CREATE TABLE "candidate_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "headline" VARCHAR(160),
    "summary" TEXT,
    "seniority" "Seniority" NOT NULL DEFAULT 'UNSPECIFIED',
    "city" VARCHAR(120),
    "region" VARCHAR(120),
    "country" VARCHAR(2),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "professional_facts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "type" "ProfessionalFactType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "organization" VARCHAR(160),
    "description" TEXT,
    "started_at" DATE,
    "ended_at" DATE,
    "source_resume_id" UUID,
    "review_status" "FactReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "professional_facts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "professional_facts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "professional_facts_source_resume_id_fkey" FOREIGN KEY ("source_resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "professional_facts_dates_check" CHECK ("ended_at" IS NULL OR "started_at" IS NULL OR "ended_at" >= "started_at"),
    CONSTRAINT "professional_facts_experience_org_check" CHECK ("type" <> 'EXPERIENCE' OR "organization" IS NOT NULL)
);

CREATE UNIQUE INDEX "candidate_profiles_user_id_key" ON "candidate_profiles"("user_id");
CREATE INDEX "professional_facts_profile_id_type_idx" ON "professional_facts"("profile_id", "type");
CREATE INDEX "professional_facts_source_resume_id_idx" ON "professional_facts"("source_resume_id");
