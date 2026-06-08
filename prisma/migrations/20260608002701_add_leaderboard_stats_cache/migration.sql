-- CreateTable
CREATE TABLE "LeaderboardStatsCache" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "profileCount" INTEGER NOT NULL,
    "agentsSum" INTEGER NOT NULL,
    "tokensSum" BIGINT NOT NULL,
    "currentStreakSum" INTEGER NOT NULL,
    "longestStreakSum" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardStatsCache_pkey" PRIMARY KEY ("id")
);
