CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

CREATE TABLE "preferences" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "desired_roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "seniorities" "Seniority"[] NOT NULL DEFAULT ARRAY[]::"Seniority"[],
    "work_modes" "WorkMode"[] NOT NULL DEFAULT ARRAY[]::"WorkMode"[],
    "locations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "salary_minimum" DECIMAL(12,2),
    "salary_currency" CHAR(3),
    "excluded_companies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "excluded_keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "preferences_profile_id_key" ON "preferences"("profile_id");

ALTER TABLE "preferences" ADD CONSTRAINT "preferences_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "preferences" ADD CONSTRAINT "preferences_salary_check"
CHECK (
  ("salary_minimum" IS NULL AND "salary_currency" IS NULL)
  OR ("salary_minimum" >= 0 AND "salary_currency" ~ '^[A-Z]{3}$')
);
