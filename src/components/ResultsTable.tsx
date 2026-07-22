import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { ListToggle } from "@/components/ListToggle";
import { ResultsToolbar } from "@/components/ResultsToolbar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { SCHOLARSHIP_LABELS, SCORE_TYPE_LABELS, UNIVERSITY_TYPE_LABELS } from "@/lib/labels";
import { CURRENT_YEAR, HISTORY_YEARS, PAGE_SIZE, type ParsedFilters } from "@/lib/search";
import { pageLinkHref, sortLinkHref } from "@/lib/url";

export type ProgramWithRelations = Prisma.ProgramGetPayload<{
  include: { university: true; yearlyStats: true };
}>;

function formatScore(v: number | null | undefined) {
  return v ? v.toFixed(3) : "–";
}

function formatInt(v: number | null | undefined) {
  return v ?? "–";
}

const SCORE_TYPE_TONE: Record<string, BadgeTone> = {
  SAY: "blue",
  EA: "accent",
  SOZ: "amber",
  DIL: "green",
  TYT: "neutral",
};

const SCHOLARSHIP_TONE: Record<string, BadgeTone> = {
  UCRETSIZ: "green",
  BURSLU: "green",
  INDIRIM_75: "amber",
  INDIRIM_50: "amber",
  INDIRIM_25: "amber",
  UCRETLI: "neutral",
};

function SortHeader({ label, field, filters }: { label: string; field: ParsedFilters["sort"]; filters: ParsedFilters }) {
  const active = filters.sort === field;
  return (
    <Link
      href={sortLinkHref(filters, field)}
      className="inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground"
    >
      {label}
      <span className={active ? "text-accent" : "text-border-strong"}>{filters.dir === "asc" ? "▲" : "▼"}</span>
    </Link>
  );
}

function RankTrend({ current, previous }: { current?: number | null; previous?: number | null }) {
  if (!current || !previous) return null;
  const delta = current - previous;
  if (delta === 0) return null;
  const easier = delta > 0;
  return (
    <span
      className={`ml-1 inline-flex items-center text-[10px] font-medium ${
        easier ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      }`}
      title={easier ? "Geçen yıla göre daha kolay yerleşme" : "Geçen yıla göre daha zor yerleşme"}
    >
      {easier ? "▾" : "▴"} {Math.abs(delta).toLocaleString("tr-TR")}
    </span>
  );
}

export function ResultsTable({
  filters,
  programs,
  total,
  totalPages,
}: {
  filters: ParsedFilters;
  programs: ProgramWithRelations[];
  total: number;
  totalPages: number;
}) {
  const years = [CURRENT_YEAR, ...HISTORY_YEARS];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="text-base font-bold text-foreground">{total.toLocaleString("tr-TR")}</span> program bulundu
          </p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Sayfa {filters.page.toLocaleString("tr-TR")} / {totalPages.toLocaleString("tr-TR")}
          </p>
        </div>
        <ResultsToolbar programs={programs} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-md)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse text-left text-xs">
            <thead className="bg-surface-muted text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium">
                  <SortHeader label="Program Kodu" field="programCode" filters={filters} />
                </th>
                <th className="p-3 font-medium">Puan Türü</th>
                <th className="p-3 font-medium">Üniversite</th>
                <th className="p-3 font-medium">Bölüm / Program</th>
                <th className="p-3 font-medium">Ek Bilgi</th>
                <th className="p-3 font-medium">Süre</th>
                <th className="p-3 font-medium">
                  <SortHeader label="Başarı Sırası" field="currentSuccessRank" filters={filters} />
                  <div className="font-normal text-border-strong">({years.join("/")})</div>
                </th>
                <th className="p-3 font-medium">
                  <SortHeader label="Taban Puanı" field="currentMinScore" filters={filters} />
                  <div className="font-normal text-border-strong">({years.join("/")})</div>
                </th>
                <th className="p-3 font-medium">Kontenjan</th>
                <th className="p-3 font-medium">Akreditasyon</th>
                <th className="p-3 font-medium">Özel Koşullar</th>
                <th className="p-3 font-medium">Listelerim</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p, i) => {
                const statByYear = new Map(p.yearlyStats.map((s) => [s.year, s]));
                return (
                  <tr key={p.id} className="border-t border-border align-top transition-colors hover:bg-accent-soft/40">
                    <td className="p-3 text-muted-foreground">{(filters.page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="p-3 font-mono text-muted-foreground">{p.programCode}</td>
                    <td className="p-3">
                      <Badge tone={SCORE_TYPE_TONE[p.scoreType] ?? "neutral"}>{SCORE_TYPE_LABELS[p.scoreType]}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{p.university.name}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <span>{p.city}</span>
                        <Badge tone={p.university.type === "DEVLET" ? "blue" : "accent"}>
                          {UNIVERSITY_TYPE_LABELS[p.university.type]}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      {p.faculty ? <div className="mt-0.5 text-muted-foreground">{p.faculty}</div> : null}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {p.language ? <span className="text-muted-foreground">{p.language}</span> : null}
                        <Badge tone={SCHOLARSHIP_TONE[p.scholarshipType] ?? "neutral"} className="w-fit">
                          {SCHOLARSHIP_LABELS[p.scholarshipType]}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.duration} yıl</td>
                    <td className="p-3">
                      {years.map((y, idx) => (
                        <div key={y} className={idx === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {formatInt(statByYear.get(y)?.successRank)}
                          {idx === 0 ? (
                            <RankTrend
                              current={statByYear.get(y)?.successRank}
                              previous={statByYear.get(years[1])?.successRank}
                            />
                          ) : null}
                        </div>
                      ))}
                    </td>
                    <td className="p-3">
                      {years.map((y, idx) => (
                        <div key={y} className={idx === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {formatScore(statByYear.get(y)?.minScore)}
                        </div>
                      ))}
                    </td>
                    <td className="p-3">
                      {years.map((y, idx) => (
                        <div key={y} className={idx === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {formatInt(statByYear.get(y)?.quota)}
                        </div>
                      ))}
                    </td>
                    <td className="p-3">
                      {p.accreditations.length ? (
                        <div className="flex flex-wrap gap-1">
                          {p.accreditations.map((a) => (
                            <Badge key={a} tone="neutral">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="max-w-xs p-3">
                      {p.specialConditions ? (
                        <details className="group">
                          <summary className="cursor-pointer font-medium text-accent select-none">
                            Göster
                          </summary>
                          <div className="mt-1.5 max-h-48 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
                            {p.specialConditions}
                          </div>
                        </details>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="p-3">
                      <ListToggle programId={p.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination filters={filters} totalPages={totalPages} />
    </div>
  );
}

function Pagination({ filters, totalPages }: { filters: ParsedFilters; totalPages: number }) {
  const current = filters.page;
  const pages = new Set<number>();
  for (let p = Math.max(1, current - 2); p <= Math.min(totalPages, current + 2); p++) pages.add(p);
  pages.add(1);
  pages.add(totalPages);

  const sorted = [...pages].sort((a, b) => a - b);

  const navBtn = "flex h-8 items-center justify-center rounded-full border border-border bg-surface px-3 text-xs font-medium text-muted-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong hover:text-foreground";

  return (
    <div className="flex items-center justify-center gap-1.5 print:hidden">
      {current > 1 ? (
        <Link href={pageLinkHref(filters, current - 1)} className={navBtn}>
          ‹ Önceki
        </Link>
      ) : null}
      {sorted.map((p, idx) => (
        <span key={p} className="flex items-center gap-1.5">
          {idx > 0 && sorted[idx - 1] !== p - 1 ? <span className="text-border-strong">…</span> : null}
          <Link
            href={pageLinkHref(filters, p)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              p === current
                ? "bg-accent text-accent-foreground shadow-[var(--shadow-sm)]"
                : "border border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}
      {current < totalPages ? (
        <Link href={pageLinkHref(filters, current + 1)} className={navBtn}>
          Sonraki ›
        </Link>
      ) : null}
    </div>
  );
}
