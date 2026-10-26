-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "courses_removedAt_idx" ON "courses"("removedAt");
