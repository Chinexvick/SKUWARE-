-- AlterTable
ALTER TABLE "Term" ADD COLUMN "resultsPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Term" ADD COLUMN "resultsPublishedAt" TIMESTAMP(3);
