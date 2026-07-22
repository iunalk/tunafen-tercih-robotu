"use client";

import { useEffect, useMemo, useState } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { AppHeader } from "@/components/ui/AppHeader";
import { Badge } from "@/components/ui/Badge";
import { SCHOLARSHIP_LABELS, SCORE_TYPE_LABELS } from "@/lib/labels";
import { LIST_KEYS, type ListKey, readLists, removeFromList, subscribeLists } from "@/lib/lists";
import { getCurrentStudent, subscribeStudent } from "@/lib/student";

const TOTAL_TERCIH_HAKKI = 24;

type ProgramWithRelations = Prisma.ProgramGetPayload<{
  include: { university: true; yearlyStats: true };
}>;

const LIST_TITLES: Record<ListKey, string> = {
  L1: "Liste 1",
  L2: "Liste 2",
  L3: "Liste 3",
};

const LIST_SUBTITLES: Record<ListKey, string> = {
  L1: "1. Öncelik",
  L2: "2. Öncelik",
  L3: "3. Öncelik",
};

function toCsv(programs: ProgramWithRelations[]): string {
  const header = [
    "Sıra",
    "Program Kodu",
    "Puan Türü",
    "Üniversite",
    "Şehir",
    "Bölüm",
    "Fakülte",
    "Ücret/Burs",
    "Başarı Sırası (2026)",
    "Taban Puanı (2026)",
    "Kontenjan (2026)",
  ];
  const rows = programs.map((p, i) => {
    const current = p.yearlyStats.find((s) => s.year === 2026);
    return [
      i + 1,
      p.programCode,
      SCORE_TYPE_LABELS[p.scoreType],
      p.university.name,
      p.city,
      p.name,
      p.faculty ?? "",
      SCHOLARSHIP_LABELS[p.scholarshipType],
      current?.successRank ?? "",
      current?.minScore ?? "",
      current?.quota ?? "",
    ];
  });
  const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(";")).join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="4" width="18" height="16" rx="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        Henüz hiçbir programı listeye eklemedin. Arama sayfasındaki sonuç tablosunda satırların sağındaki
        <span className="mx-1 font-semibold text-foreground">L1 / L2 / L3</span>
        butonlarını kullanarak buraya program ekleyebilirsin.
      </p>
    </div>
  );
}

function ProgramCard({ program, index, onRemove }: { program: ProgramWithRelations; index: number; onRemove: () => void }) {
  const current = program.yearlyStats.find((s) => s.year === 2026);
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-semibold text-foreground">{program.university.name}</span>
          <Badge tone="neutral" className="font-mono">
            {program.programCode}
          </Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{program.name}</span>
          {program.faculty ? <span className="hidden sm:inline">· {program.faculty}</span> : null}
        </div>
      </div>
      <div className="hidden shrink-0 gap-6 text-right sm:flex">
        <div>
          <div className="text-[11px] tracking-wide text-muted-foreground uppercase">Başarı Sırası</div>
          <div className="font-semibold text-foreground">{current?.successRank ?? "–"}</div>
        </div>
        <div>
          <div className="text-[11px] tracking-wide text-muted-foreground uppercase">Taban Puan</div>
          <div className="font-semibold text-foreground">{current?.minScore?.toFixed(3) ?? "–"}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Listeden kaldır"
        className="print:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default function ListelerimPage() {
  const [studentName, setStudentName] = useState<string>("");
  const [lists, setLists] = useState<Record<ListKey, number[]>>({ L1: [], L2: [], L3: [] });
  const [programsById, setProgramsById] = useState<Map<number, ProgramWithRelations>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setStudentName(getCurrentStudent());
      setLists(readLists());
    };
    sync();
    const unsubLists = subscribeLists(sync);
    const unsubStudent = subscribeStudent(sync);
    return () => {
      unsubLists();
      unsubStudent();
    };
  }, []);

  const allIds = useMemo(
    () => Array.from(new Set([...lists.L1, ...lists.L2, ...lists.L3])),
    [lists]
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const data: { programs: ProgramWithRelations[] } = allIds.length
        ? await fetch(`/api/programs?ids=${allIds.join(",")}`).then((r) => r.json())
        : { programs: [] };
      if (!active) return;
      setProgramsById(new Map(data.programs.map((p) => [p.id, p])));
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [allIds]);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        active="/listelerim"
        subtitle={studentName ? `${studentName} için tercih listesi` : "Tercih listelerin bu tarayıcıda saklanır"}
        extra={
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M6 9V4h12v5M6 18h12v4H6v-4Zm-3-9h18v7H3V9Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Yazdır
          </button>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 sm:p-6">
        {!loading && allIds.length === 0 ? <EmptyState /> : null}

        {LIST_KEYS.map((key) => {
          const programs = lists[key]
            .map((id) => programsById.get(id))
            .filter((p): p is ProgramWithRelations => Boolean(p));

          if (loading) return null;
          if (allIds.length === 0) return null;

          return (
            <section key={key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">{LIST_TITLES[key]}</h2>
                  <span className="text-sm text-muted-foreground">
                    {LIST_SUBTITLES[key]} ·{" "}
                    <span className={programs.length > TOTAL_TERCIH_HAKKI ? "font-semibold text-rose-600 dark:text-rose-400" : undefined}>
                      {programs.length} / {TOTAL_TERCIH_HAKKI}
                    </span>{" "}
                    tercih
                  </span>
                </div>
                {programs.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      downloadCsv(
                        `tunafen-${studentName.toLowerCase().replace(/\s+/g, "-")}-${key.toLowerCase()}.csv`,
                        toCsv(programs)
                      )
                    }
                    className="print:hidden flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path
                        d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    CSV İndir
                  </button>
                ) : null}
              </div>

              {programs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Bu listede henüz program yok.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {programs.map((p, i) => (
                    <ProgramCard key={p.id} program={p} index={i} onRemove={() => removeFromList(p.id, key)} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
