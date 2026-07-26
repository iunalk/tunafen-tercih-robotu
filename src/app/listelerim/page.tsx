"use client";

import { useEffect, useMemo, useState } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { AppHeader } from "@/components/ui/AppHeader";
import { Badge } from "@/components/ui/Badge";
import { SCHOLARSHIP_LABELS, SCORE_TYPE_LABELS } from "@/lib/labels";
import { LIST_KEYS, type ListKey, readLists, removeFromList, subscribeLists } from "@/lib/lists";
import { loadNotoSansBase64 } from "@/lib/pdfFont";
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

const EXPORT_HEADER = [
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

function toExportRows(programs: ProgramWithRelations[]): (string | number)[][] {
  return programs.map((p, i) => {
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
}

function escapeHtml(v: unknown): string {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Bağımlılıksız Excel export: Excel'in doğrudan açabildiği bir HTML tablosunu
 * .xls uzantısıyla indirir (SheetJS gibi ağır/güvenlik uyarılı kütüphanelere gerek kalmadan). */
function downloadExcel(filename: string, programs: ProgramWithRelations[]) {
  const rows = toExportRows(programs);
  const table = `
    <table>
      <thead><tr>${EXPORT_HEADER.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${table}</body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadListPdf(filename: string, title: string, programs: ProgramWithRelations[]) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const fontBase64 = await loadNotoSansBase64();

  const doc = new jsPDF({ orientation: "landscape" });
  doc.addFileToVFS("NotoSans-Regular.ttf", fontBase64);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");

  doc.setFontSize(13);
  doc.text(title, 14, 12);
  doc.setFontSize(8);
  doc.text(`${programs.length} program · ${new Date().toLocaleDateString("tr-TR")}`, 14, 17);

  autoTable(doc, {
    startY: 21,
    styles: { font: "NotoSans", fontStyle: "normal", fontSize: 8, cellPadding: 1.5 },
    headStyles: { font: "NotoSans", fontStyle: "normal", fillColor: [79, 70, 229] },
    head: [EXPORT_HEADER],
    body: toExportRows(programs),
  });

  doc.save(filename);
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
      try {
        if (!allIds.length) {
          if (active) setProgramsById(new Map());
          return;
        }
        const res = await fetch(`/api/programs?ids=${allIds.join(",")}`);
        if (!res.ok) throw new Error("Programlar yüklenemedi");
        const data: { programs: ProgramWithRelations[] } = await res.json();
        if (!active) return;
        setProgramsById(new Map(data.programs.map((p) => [p.id, p])));
      } catch {
        if (active) setProgramsById(new Map());
      } finally {
        if (active) setLoading(false);
      }
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
                  <div className="print:hidden flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadExcel(
                          `tunafen-${studentName.toLowerCase().replace(/\s+/g, "-")}-${key.toLowerCase()}.xls`,
                          programs
                        )
                      }
                      className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Excel İndir
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadListPdf(
                          `tunafen-${studentName.toLowerCase().replace(/\s+/g, "-")}-${key.toLowerCase()}.pdf`,
                          `${studentName} — ${LIST_TITLES[key]}`,
                          programs
                        )
                      }
                      className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      PDF İndir
                    </button>
                  </div>
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
