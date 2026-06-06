/*
  Warnings:

  - A unique constraint covering the columns `[name,educatorId]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "courses_name_educatorId_key" ON "courses"("name", "educatorId");
