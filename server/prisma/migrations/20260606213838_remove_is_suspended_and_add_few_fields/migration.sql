/*
  Warnings:

  - You are about to drop the column `isRevoked` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `isSuspended` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,resourceId]` on the table `quiz_attempts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "isRevoked",
ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quiz_attempts" ADD COLUMN     "answers" INTEGER[],
ADD COLUMN     "score" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isSuspended";

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_studentId_resourceId_key" ON "quiz_attempts"("studentId", "resourceId");
