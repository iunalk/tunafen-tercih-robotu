import type { ParsedFilters } from "@/lib/search";

/** Mevcut filtreleri URLSearchParams'a çevirir; override ile belirli alanlar değiştirilebilir. */
export function filtersToSearchParams(
  filters: ParsedFilters,
  overrides: Record<string, string | number | undefined> = {}
): URLSearchParams {
  const sp = new URLSearchParams();

  for (const v of filters.scoreTypes) sp.append("scoreType", v);
  for (const v of filters.degreeTypes) sp.append("degreeType", v);
  for (const v of filters.deptNames) sp.append("dept", v);
  for (const v of filters.cities) sp.append("city", v);
  for (const v of filters.universityIds) sp.append("universityId", String(v));
  for (const v of filters.scholarshipTypes) sp.append("scholarshipType", v);
  if (filters.universityType) sp.set("universityType", filters.universityType);
  if (filters.minRank !== undefined) sp.set("minRank", String(filters.minRank));
  if (filters.maxRank !== undefined) sp.set("maxRank", String(filters.maxRank));
  if (filters.minScore !== undefined) sp.set("minScore", String(filters.minScore));
  if (filters.maxScore !== undefined) sp.set("maxScore", String(filters.maxScore));
  sp.set("sort", filters.sort);
  sp.set("dir", filters.dir);
  sp.set("page", String(filters.page));

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      sp.delete(key);
    } else {
      sp.set(key, String(value));
    }
  }

  return sp;
}

export function sortLinkHref(filters: ParsedFilters, field: ParsedFilters["sort"]): string {
  const nextDir = filters.sort === field && filters.dir === "asc" ? "desc" : "asc";
  const sp = filtersToSearchParams(filters, { sort: field, dir: nextDir, page: 1 });
  return `/?${sp.toString()}`;
}

export function pageLinkHref(filters: ParsedFilters, page: number): string {
  const sp = filtersToSearchParams(filters, { page });
  return `/?${sp.toString()}`;
}
