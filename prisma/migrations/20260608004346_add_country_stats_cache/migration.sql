-- CreateTable
CREATE TABLE "CountryStatsCache" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "countryCount" INTEGER NOT NULL,
    "topModels" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryStatsCache_pkey" PRIMARY KEY ("id")
);
