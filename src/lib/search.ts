import type { Prisma } from "@/generated/prisma/client";
import type { DegreeType, ScholarshipType, ScoreType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 20;
export const CURRENT_YEAR = 2026;
export const HISTORY_YEARS = [2025, 2024, 2023];

const SORT_FIELDS = ["currentSuccessRank", "currentMinScore", "programCode"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toInt(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ParsedFilters {
  scoreTypes: ScoreType[];
  degreeTypes: DegreeType[];
  deptNames: string[];
  cities: string[];
  universityIds: number[];
  scholarshipTypes: ScholarshipType[];
  universityType?: "DEVLET" | "VAKIF";
  minRank?: number;
  maxRank?: number;
  minScore?: number;
  maxScore?: number;
  sort: SortField;
  dir: "asc" | "desc";
  page: number;
}

export function parseFilters(params: RawSearchParams): ParsedFilters {
  const sortParam = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = (SORT_FIELDS as readonly string[]).includes(sortParam ?? "")
    ? (sortParam as SortField)
    : "currentSuccessRank";
  const dirParam = Array.isArray(params.dir) ? params.dir[0] : params.dir;

  return {
    scoreTypes: toArray(params.scoreType) as ScoreType[],
    degreeTypes: toArray(params.degreeType) as DegreeType[],
    deptNames: toArray(params.dept),
    cities: toArray(params.city),
    universityIds: toArray(params.universityId).map(Number).filter(Number.isFinite),
    scholarshipTypes: toArray(params.scholarshipType) as ScholarshipType[],
    universityType:
      params.universityType === "DEVLET" || params.universityType === "VAKIF"
        ? params.universityType
        : undefined,
    minRank: toInt(params.minRank),
    maxRank: toInt(params.maxRank),
    minScore: toInt(params.minScore),
    maxScore: toInt(params.maxScore),
    sort,
    dir: dirParam === "desc" ? "desc" : "asc",
    page: Math.max(1, toInt(params.page) ?? 1),
  };
}

/** `exclude` ile belirtilen boyut dışındaki tüm aktif filtreleri Prisma where'e çevirir. */
function buildWhere(filters: ParsedFilters, exclude?: "city" | "university" | "dept"): Prisma.ProgramWhereInput {
  const where: Prisma.ProgramWhereInput = {};

  if (filters.scoreTypes.length) where.scoreType = { in: filters.scoreTypes };
  if (filters.degreeTypes.length) where.degreeType = { in: filters.degreeTypes };
  if (filters.scholarshipTypes.length) where.scholarshipType = { in: filters.scholarshipTypes };
  if (filters.universityType) where.university = { type: filters.universityType };
  if (exclude !== "dept" && filters.deptNames.length) where.name = { in: filters.deptNames };
  if (exclude !== "city" && filters.cities.length) where.city = { in: filters.cities };
  if (exclude !== "university" && filters.universityIds.length) where.universityId = { in: filters.universityIds };

  if (filters.minRank !== undefined || filters.maxRank !== undefined) {
    where.currentSuccessRank = {
      ...(filters.minRank !== undefined ? { gte: filters.minRank } : {}),
      ...(filters.maxRank !== undefined ? { lte: filters.maxRank } : {}),
    };
  }
  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    where.currentMinScore = {
      ...(filters.minScore !== undefined ? { gte: filters.minScore } : {}),
      ...(filters.maxScore !== undefined ? { lte: filters.maxScore } : {}),
    };
  }

  return where;
}

export async function searchPrograms(filters: ParsedFilters) {
  const where = buildWhere(filters);

  const [total, programs] = await Promise.all([
    prisma.program.count({ where }),
    prisma.program.findMany({
      where,
      orderBy: [{ [filters.sort]: { sort: filters.dir, nulls: "last" } }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        university: true,
        yearlyStats: { where: { year: { in: [CURRENT_YEAR, ...HISTORY_YEARS] } } },
      },
    }),
  ]);

  return { total, programs, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/**
 * Şehir/üniversite/bölüm listelerini, o boyutun KENDİSİ hariç diğer tüm aktif
 * filtrelere göre daraltır (klasik "faceted search" deseni) — böylece bir şehir
 * seçtiğinde üniversite ve bölüm listeleri otomatik güncellenir, ama şehrin
 * kendisini tekrar seçebilmen engellenmez.
 */
export async function getFilterOptions(filters: ParsedFilters) {
  const [cityRows, universityRows, deptRows] = await Promise.all([
    prisma.program.findMany({
      where: buildWhere(filters, "city"),
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    }),
    prisma.university.findMany({
      where: { programs: { some: buildWhere(filters, "university") } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.program.findMany({
      where: buildWhere(filters, "dept"),
      distinct: ["name"],
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    cities: cityRows.map((c) => c.city),
    universities: universityRows,
    departments: deptRows.map((d) => d.name),
  };
}
