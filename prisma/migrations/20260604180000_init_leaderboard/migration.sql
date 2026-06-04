-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('ok', 'not_found', 'parse_error');

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT NOT NULL,
    "isAmbassador" BOOLEAN NOT NULL DEFAULT false,
    "joinedDaysAgo" INTEGER,
    "agentsTotal" INTEGER NOT NULL DEFAULT 0,
    "agentsLocal" INTEGER NOT NULL DEFAULT 0,
    "agentsCloud" INTEGER NOT NULL DEFAULT 0,
    "currentStreakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreakDays" INTEGER NOT NULL DEFAULT 0,
    "longestAgentHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokensTotal" BIGINT NOT NULL DEFAULT 0,
    "topModels" JSONB NOT NULL DEFAULT '[]',
    "scrapeStatus" "ScrapeStatus" NOT NULL DEFAULT 'parse_error',
    "scrapeError" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_handle_key" ON "LeaderboardEntry"("handle");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_agentsTotal_idx" ON "LeaderboardEntry"("agentsTotal" DESC);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_country_agentsTotal_idx" ON "LeaderboardEntry"("country", "agentsTotal" DESC);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_tokensTotal_idx" ON "LeaderboardEntry"("tokensTotal" DESC);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_currentStreakDays_idx" ON "LeaderboardEntry"("currentStreakDays" DESC);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_longestStreakDays_idx" ON "LeaderboardEntry"("longestStreakDays" DESC);
