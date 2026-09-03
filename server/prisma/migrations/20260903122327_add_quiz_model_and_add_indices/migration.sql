/*
  Warnings:

  - You are about to drop the column `answers` on the `quiz_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `attemptNumber` on the `quiz_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted` on the `quiz_attempts` table. All the data in the column will be lost.
  - Made the column `score` on table `quiz_attempts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_resourceId_fkey";

-- DropIndex
DROP INDEX "quiz_attempts_studentId_resourceId_key";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "enrollmentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxSeats" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "quiz_attempts" DROP COLUMN "answers",
DROP COLUMN "attemptNumber",
DROP COLUMN "isCompleted",
ALTER COLUMN "isPassed" DROP DEFAULT,
ALTER COLUMN "score" SET NOT NULL;

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" TEXT NOT NULL,
    "quizAttemptId" TEXT NOT NULL,
    "quizQuestionId" TEXT NOT NULL,
    "selectedOption" INTEGER NOT NULL,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_answers_quizAttemptId_idx" ON "quiz_answers"("quizAttemptId");

-- CreateIndex
CREATE INDEX "quiz_answers_quizQuestionId_idx" ON "quiz_answers"("quizQuestionId");

-- CreateIndex
CREATE INDEX "assignments_courseId_idx" ON "assignments"("courseId");

-- CreateIndex
CREATE INDEX "assignments_educatorId_idx" ON "assignments"("educatorId");

-- CreateIndex
CREATE INDEX "assignments_resourceId_idx" ON "assignments"("resourceId");

-- CreateIndex
CREATE INDEX "attendances_studentId_idx" ON "attendances"("studentId");

-- CreateIndex
CREATE INDEX "attendances_courseId_idx" ON "attendances"("courseId");

-- CreateIndex
CREATE INDEX "attendances_removedAt_idx" ON "attendances"("removedAt");

-- CreateIndex
CREATE INDEX "complaints_studentId_idx" ON "complaints"("studentId");

-- CreateIndex
CREATE INDEX "complaints_educatorId_idx" ON "complaints"("educatorId");

-- CreateIndex
CREATE INDEX "complaints_removedAt_idx" ON "complaints"("removedAt");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "courses_educatorId_idx" ON "courses"("educatorId");

-- CreateIndex
CREATE INDEX "courses_name_idx" ON "courses"("name");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- CreateIndex
CREATE INDEX "enrollments_removedAt_idx" ON "enrollments"("removedAt");

-- CreateIndex
CREATE INDEX "quiz_attempts_studentId_idx" ON "quiz_attempts"("studentId");

-- CreateIndex
CREATE INDEX "quiz_attempts_resourceId_idx" ON "quiz_attempts"("resourceId");

-- CreateIndex
CREATE INDEX "quiz_attempts_studentId_resourceId_idx" ON "quiz_attempts"("studentId", "resourceId");

-- CreateIndex
CREATE INDEX "quiz_questions_resourceId_idx" ON "quiz_questions"("resourceId");

-- CreateIndex
CREATE INDEX "resources_courseId_idx" ON "resources"("courseId");

-- CreateIndex
CREATE INDEX "resources_educatorId_idx" ON "resources"("educatorId");

-- CreateIndex
CREATE INDEX "submissions_assignmentId_idx" ON "submissions"("assignmentId");

-- CreateIndex
CREATE INDEX "submissions_studentId_idx" ON "submissions"("studentId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_removedAt_idx" ON "users"("removedAt");

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_quizQuestionId_fkey" FOREIGN KEY ("quizQuestionId") REFERENCES "quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
