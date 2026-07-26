"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProgramWithRelations } from "@/components/ResultsTable";
import { CURRENT_YEAR } from "@/lib/constants";
import { SCHOLARSHIP_LABELS, SCORE_TYPE_LABELS } from "@/lib/labels";
import { addManyToList, LIST_KEYS, type ListKey } from "@/lib/lists";
import { loadNotoSansBase64 } from "@/lib/pdfFont";
import { useSelection } from "@/lib/selection";
import { buildTercihListTitle, subscribeStudent } from "@/lib/student";

const LIST_LABELS: Record<ListKey, string> = { L1: "Liste 1", L2: "Liste 2", L3: "Liste 3" };

const AI_TRANSFER_KEY = "tunafen:aiTransfer";

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9V4h12v5M6 18h12v4H6v-4Zm-3-9h18v7H3V9Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ListPlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h9M4 18h9" strokeLinecap="round" />
      <path d="M18 15v6m-3-3h6" strokeLinecap="round" />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3Z" strokeLinejoin="round" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" strokeLinejoin="round" />
    </svg>
  );
}

const btnClass =
  "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong disabled:opacity-60";

export function ResultsToolbar({ programs }: { programs: ProgramWithRelations[] }) {
  const router = useRouter();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [transferred, setTransferred] = useState(false);
  const [title, setTitle] = useState("2026 YKS Tercih Öneri Listesi");
  const { selected, clear } = useSelection();
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<ListKey | null>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function sync() {
      setTitle(buildTercihListTitle());
    }
    sync();
    return subscribeStudent(sync);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (listMenuRef.current && !listMenuRef.current.contains(e.target as Node)) setListMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function addSelectedToList(key: ListKey) {
    addManyToList([...selected], key);
    setListMenuOpen(false);
    setAddedFeedback(key);
    clear();
    setTimeout(() => setAddedFeedback(null), 2000);
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
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
      doc.text(`Bu sayfadaki ${programs.length} program · ${new Date().toLocaleDateString("tr-TR")}`, 14, 17);

      autoTable(doc, {
        startY: 21,
        styles: { font: "NotoSans", fontStyle: "normal", fontSize: 7, cellPadding: 1.5 },
        headStyles: { font: "NotoSans", fontStyle: "normal", fillColor: [79, 70, 229] },
        head: [["#", "Program Kodu", "Puan Türü", "Üniversite", "Bölüm", "Ücret/Burs", "Başarı Sırası", "Taban Puan", "Kontenjan"]],
        body: programs.map((p, i) => {
          const current = p.yearlyStats.find((s) => s.year === CURRENT_YEAR);
          return [
            i + 1,
            p.programCode,
            SCORE_TYPE_LABELS[p.scoreType],
            p.university.name,
            p.name,
            SCHOLARSHIP_LABELS[p.scholarshipType],
            current?.successRank ?? "-",
            current?.minScore?.toFixed(3) ?? "-",
            current?.quota ?? "-",
          ];
        }),
      });

      doc.save("tunafen-tercih-listesi.pdf");
    } finally {
      setPdfLoading(false);
    }
  }

  function transferToAi() {
    const ids = programs.map((p) => p.id);
    window.localStorage.setItem(AI_TRANSFER_KEY, JSON.stringify(ids));
    setTransferred(true);
    router.push("/ai-danisman?aktarildi=1");
  }

  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
      <p className="hidden text-sm font-semibold text-foreground print:block">{title}</p>
      <div className="flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} className={btnClass}>
          <PrintIcon />
          Yazdır
        </button>
        <button type="button" onClick={downloadPdf} disabled={pdfLoading} className={btnClass}>
          <PdfIcon />
          {pdfLoading ? "Hazırlanıyor..." : "PDF İndir"}
        </button>
        <div className="relative" ref={listMenuRef}>
          <button
            type="button"
            onClick={() => setListMenuOpen((v) => !v)}
            disabled={selected.size === 0}
            className={btnClass}
          >
            <ListPlusIcon />
            {addedFeedback ? `${LIST_LABELS[addedFeedback]}'e eklendi ✓` : `Listeye Ekle${selected.size ? ` (${selected.size})` : ""}`}
          </button>
          {listMenuOpen ? (
            <div className="absolute left-0 z-30 mt-1.5 w-36 rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lg)]">
              {LIST_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => addSelectedToList(key)}
                  className="block w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent-soft"
                >
                  {LIST_LABELS[key]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={transferToAi}
          className={`${btnClass} border-accent/40 bg-accent-soft text-accent hover:border-accent`}
        >
          <AiIcon />
          {transferred ? "Aktarıldı ✓" : "AI'ya Aktar"}
        </button>
      </div>
    </div>
  );
}
