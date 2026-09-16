CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "installation_key" VARCHAR(32) NOT NULL DEFAULT 'primary',
    "email" VARCHAR(320) NOT NULL,
    "display_name" VARCHAR(120),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_single_installation_check" CHECK ("installation_key" = 'primary')
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_installation_key_key" ON "users"("installation_key");
