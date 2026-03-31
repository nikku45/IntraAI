-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('free', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'processing', 'indexed', 'failed');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'free',
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "max_documents" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "s3_key" VARCHAR(1000) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL,
    "vector_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queries" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "query_text" TEXT NOT NULL,
    "response_text" TEXT NOT NULL,
    "retrieved_chunk_ids" UUID[],
    "model_used" VARCHAR(100) NOT NULL,
    "tokens_used" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
