import type { ScoreType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface StudentProfile {
  scoreType: ScoreType;
  rank: number;
  city?: string;
  universityType?: "DEVLET" | "VAKIF";
  interest?: string;
}

export interface Candidate {
  programCode: string;
  university: string;
  universityType: string;
  city: string;
  name: string;
  faculty: string | null;
  degreeType: string;
  scholarshipType: string;
  duration: number;
  language: string | null;
  successRank: number;
  minScore: number | null;
  quota: number | null;
  accreditations: string[];
}

/** Öğrencinin sıralamasına yakın programları getirir (basit, embedding'siz RAG). */
export async function findCandidates(profile: StudentProfile, limit = 60): Promise<Candidate[]> {
  const rank = profile.rank;
  const interests = (profile.interest ?? "")
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const baseWhere = {
    scoreType: profile.scoreType,
    currentSuccessRank: { gte: Math.max(1, Math.floor(rank * 0.3)), lte: Math.ceil(rank * 3) },
    ...(profile.city ? { city: profile.city } : {}),
    ...(profile.universityType ? { university: { type: profile.universityType } } : {}),
  };

  let rows = await prisma.program.findMany({
    where: {
      ...baseWhere,
      ...(interests.length
        ? { OR: interests.map((kw) => ({ name: { contains: kw, mode: "insensitive" as const } })) }
        : {}),
    },
    include: { university: true },
    orderBy: { currentSuccessRank: "asc" },
    take: 400,
  });

  // İlgi alanı filtresi çok az/hiç sonuç verdiyse, filtreyi gevşetip geniş listeden devam et.
  if (interests.length && rows.length < 10) {
    rows = await prisma.program.findMany({
      where: baseWhere,
      include: { university: true },
      orderBy: { currentSuccessRank: "asc" },
      take: 400,
    });
  }

  const withDistance = rows
    .filter((r) => r.currentSuccessRank !== null)
    .map((r) => ({
      row: r,
      distance: Math.abs((r.currentSuccessRank as number) - rank),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return withDistance.map(({ row }) => toCandidate(row));
}

/** Kullanıcının arama sayfasında filtrelediği ve "AI'ya Aktar" ile gönderdiği
 * program listesini, sıralamaya göre değil olduğu gibi Candidate'e çevirir. */
export async function findCandidatesByIds(ids: number[]): Promise<Candidate[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.program.findMany({
    where: { id: { in: ids } },
    include: { university: true },
  });
  // Aktarılan sırayı korumak için orijinal id listesine göre sırala.
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r) && r!.currentSuccessRank !== null)
    .map((row) => toCandidate(row));
}

function toCandidate(row: {
  programCode: string;
  university: { name: string; type: string };
  city: string;
  name: string;
  faculty: string | null;
  degreeType: string;
  scholarshipType: string;
  duration: number;
  language: string | null;
  currentSuccessRank: number | null;
  currentMinScore: number | null;
  currentQuota: number | null;
  accreditations: string[];
}): Candidate {
  return {
    programCode: row.programCode,
    university: row.university.name,
    universityType: row.university.type,
    city: row.city,
    name: row.name,
    faculty: row.faculty,
    degreeType: row.degreeType,
    scholarshipType: row.scholarshipType,
    duration: row.duration,
    language: row.language,
    successRank: row.currentSuccessRank as number,
    minScore: row.currentMinScore,
    quota: row.currentQuota,
    accreditations: row.accreditations,
  };
}
