-- CreateTable
CREATE TABLE "CountryDetailCache" (
    "country" CHAR(2) NOT NULL,
    "profileCount" INTEGER NOT NULL,
    "globalRank" INTEGER,
    "topModel" TEXT,
    "avgAgentsTotal" DOUBLE PRECISION NOT NULL,
    "avgCloudShare" DOUBLE PRECISION NOT NULL,
    "maxLongestStreak" INTEGER NOT NULL,
    "topBuilders" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryDetailCache_pkey" PRIMARY KEY ("country")
);

-- CreateTable
CREATE TABLE "ModelStatsCache" (
    "model" TEXT NOT NULL,
    "profileCount" INTEGER NOT NULL,
    "topCountries" JSONB NOT NULL,
    "topBuilders" JSONB NOT NULL,
    "avgAgentsTotal" DOUBLE PRECISION NOT NULL,
    "avgCurrentStreak" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelStatsCache_pkey" PRIMARY KEY ("model")
);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_longestAgentHours_idx" ON "LeaderboardEntry"("longestAgentHours" DESC);
