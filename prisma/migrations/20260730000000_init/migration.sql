CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');
CREATE TABLE "inquiries" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT,
  "service" TEXT NOT NULL,
  "projectType" TEXT NOT NULL,
  "budget" TEXT,
  "timeline" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inquiries_leadId_key" ON "inquiries"("leadId");
CREATE INDEX "inquiries_status_createdAt_idx" ON "inquiries"("status", "createdAt");
CREATE INDEX "inquiries_email_createdAt_idx" ON "inquiries"("email", "createdAt");
