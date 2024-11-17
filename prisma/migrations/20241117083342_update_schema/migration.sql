/*
  Warnings:

  - A unique constraint covering the columns `[profileId]` on the table `Social` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Social_profileId_key" ON "Social"("profileId");
