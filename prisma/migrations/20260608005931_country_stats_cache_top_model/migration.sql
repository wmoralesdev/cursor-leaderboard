/*
  Warnings:

  - You are about to drop the column `topModels` on the `CountryStatsCache` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CountryStatsCache" DROP COLUMN "topModels",
ADD COLUMN     "topModel" TEXT;
