-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "currentMinScore" DOUBLE PRECISION,
ADD COLUMN     "currentQuota" INTEGER,
ADD COLUMN     "currentSuccessRank" INTEGER;

-- CreateIndex
CREATE INDEX "Program_currentSuccessRank_idx" ON "Program"("currentSuccessRank");

-- CreateIndex
CREATE INDEX "Program_currentMinScore_idx" ON "Program"("currentMinScore");
