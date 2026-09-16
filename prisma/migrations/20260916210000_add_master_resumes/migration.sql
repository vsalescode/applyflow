CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "media_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "extracted_text" TEXT NOT NULL,
    "page_count" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "resumes_size_bytes_check" CHECK ("size_bytes" > 0 AND "size_bytes" <= 5242880),
    CONSTRAINT "resumes_page_count_check" CHECK ("page_count" > 0 AND "page_count" <= 30)
);

CREATE UNIQUE INDEX "resumes_storage_key_key" ON "resumes"("storage_key");
CREATE INDEX "resumes_user_id_created_at_idx" ON "resumes"("user_id", "created_at");
CREATE UNIQUE INDEX "resumes_one_active_per_user_key" ON "resumes"("user_id") WHERE "is_active" = true;
