"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_STUDENT, getCurrentStudent, getKnownStudents, setCurrentStudent, subscribeStudent } from "@/lib/student";

export function StudentSwitcher() {
  const [name, setName] = useState<string>(DEFAULT_STUDENT);
  const [known, setKnown] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      setName(getCurrentStudent());
      setKnown(getKnownStudents());
    };
    sync();
    return subscribeStudent(sync);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(n: string) {
    setCurrentStudent(n);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(name === DEFAULT_STUDENT ? "" : name);
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
        </svg>
        <span className="max-w-[7rem] truncate">{name}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-lg)]">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Öğrenci Adı</p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) select(draft.trim());
              }}
              placeholder="örn. Ayşe Yılmaz"
              autoFocus
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="button"
              onClick={() => draft.trim() && select(draft.trim())}
              className="shrink-0 rounded-lg bg-accent px-2.5 text-xs font-semibold text-accent-foreground"
            >
              Kaydet
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tercih listeleri girdiğin isme özel olarak bu tarayıcıda saklanır.
          </p>
          {known.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {known.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => select(n)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                    n === name
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
