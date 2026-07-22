-- CreateEnum
CREATE TYPE "UniversityType" AS ENUM ('DEVLET', 'VAKIF');

-- CreateEnum
CREATE TYPE "ScoreType" AS ENUM ('SAY', 'EA', 'SOZ', 'DIL', 'TYT');

-- CreateEnum
CREATE TYPE "DegreeType" AS ENUM ('LISANS', 'ONLISANS', 'OZEL_YETENEK', 'ACIKOGRETIM', 'UZAKTAN');

-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('UCRETSIZ', 'BURSLU', 'INDIRIM_75', 'INDIRIM_50', 'INDIRIM_25', 'UCRETLI');

-- CreateTable
CREATE TABLE "University" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" "UniversityType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "programCode" TEXT NOT NULL,
    "universityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "faculty" TEXT,
    "city" TEXT NOT NULL,
    "scoreType" "ScoreType" NOT NULL,
    "degreeType" "DegreeType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "language" TEXT,
    "scholarshipType" "ScholarshipType" NOT NULL,
    "specialConditions" TEXT,
    "accreditations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramYearlyStat" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "quota" INTEGER,
    "enrolled" INTEGER,
    "minScore" DOUBLE PRECISION,
    "successRank" INTEGER,

    CONSTRAINT "ProgramYearlyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_name_key" ON "University"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Program_programCode_key" ON "Program"("programCode");

-- CreateIndex
CREATE INDEX "Program_scoreType_idx" ON "Program"("scoreType");

-- CreateIndex
CREATE INDEX "Program_city_idx" ON "Program"("city");

-- CreateIndex
CREATE INDEX "Program_degreeType_idx" ON "Program"("degreeType");

-- CreateIndex
CREATE INDEX "Program_universityId_idx" ON "Program"("universityId");

-- CreateIndex
CREATE INDEX "ProgramYearlyStat_year_idx" ON "ProgramYearlyStat"("year");

-- CreateIndex
CREATE INDEX "ProgramYearlyStat_successRank_idx" ON "ProgramYearlyStat"("successRank");

-- CreateIndex
CREATE INDEX "ProgramYearlyStat_minScore_idx" ON "ProgramYearlyStat"("minScore");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramYearlyStat_programId_year_key" ON "ProgramYearlyStat"("programId", "year");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramYearlyStat" ADD CONSTRAINT "ProgramYearlyStat_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
