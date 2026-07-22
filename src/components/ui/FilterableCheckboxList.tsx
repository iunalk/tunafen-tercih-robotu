"use client";

import { useEffect, useMemo, useState } from "react";

export interface CheckboxOption {
  value: string;
  label: string;
}

export function FilterableCheckboxList({
  name,
  options,
  selected,
  placeholder = "Ara...",
  emptyLabel = "Sonuç yok",
  maxHeight = "10.5rem",
}: {
  name: string;
  options: CheckboxOption[];
  selected: string[];
  placeholder?: string;
  emptyLabel?: string;
  maxHeight?: string;
}) {
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<Set<string>>(() => new Set(selected));

  // `selected` sunucudan (URL'den) geldiği için, yeni bir arama sonucu geldiğinde
  // (gerçek bir filtre gönderiminden sonra) yerel seçim durumunu senkronize et.
  const selectedKey = JSON.stringify(selected);
  useEffect(() => {
    function sync() {
      setChecked(new Set(selected));
    }
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return options;
    return options.filter((o) => o.label.toLocaleLowerCase("tr-TR").includes(q));
  }, [query, options]);

  const allFilteredChecked = filtered.length > 0 && filtered.every((o) => checked.has(o.value));

  function toggleOne(value: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev);
      if (allFilteredChecked) {
        for (const o of filtered) next.delete(o.value);
      } else {
        for (const o of filtered) next.add(o.value);
      }
      return next;
    });
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-1.5">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-ring/30"
      />

      {options.length > 0 ? (
        <label className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-muted">
          <input type="checkbox" checked={allFilteredChecked} onChange={toggleAll} className="shrink-0 accent-accent" />
          <span className="truncate">Tümünü Seç{query ? " (aramayla eşleşenler)" : ""}</span>
          {checked.size > 0 ? (
            <span className="ml-auto shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              {checked.size} seçili
            </span>
          ) : null}
        </label>
      ) : null}

      <div
        className="flex min-w-0 w-full flex-col gap-0.5 overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-surface p-1.5"
        style={{ maxHeight }}
      >
        {options.length === 0 ? <p className="p-1.5 text-xs text-muted-foreground">{emptyLabel}</p> : null}
        {options.length > 0 && filtered.length === 0 ? (
          <p className="p-1.5 text-xs text-muted-foreground">Aramanla eşleşen sonuç yok.</p>
        ) : null}
        {filtered.map((o) => (
          <label
            key={o.value}
            className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-foreground hover:bg-surface-muted"
          >
            <input
              type="checkbox"
              name={name}
              value={o.value}
              checked={checked.has(o.value)}
              onChange={() => toggleOne(o.value)}
              className="shrink-0 accent-accent"
            />
            <span className="min-w-0 truncate">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
