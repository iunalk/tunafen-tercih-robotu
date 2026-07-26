"use client";

import { useState } from "react";

export function SegmentedRadio({
  name,
  options,
}: {
  name: string;
  options: { value: string; label: string; defaultChecked?: boolean }[];
}) {
  const initial = options.find((o) => o.defaultChecked)?.value ?? "";
  const [selected, setSelected] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);

  // Sunucudan gelen filtre durumu (URL) değiştiğinde, React aynı DOM
  // düğümünü yeniden kullanırsa defaultChecked tekrar uygulanmaz — bu yüzden
  // güncel değeri açıkça senkronize ediyoruz (bkz. PillCheckbox).
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setSelected(initial);
  }

  return (
    <div className="inline-flex w-full rounded-lg border border-border bg-surface-muted p-1">
      {options.map((opt) => (
        <label key={opt.value || "all"} className="group flex-1 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={selected === opt.value}
            onChange={() => setSelected(opt.value)}
            className="peer sr-only"
          />
          <span
            className="flex items-center justify-center rounded-md px-3 py-1.5 text-center text-xs font-medium text-muted-foreground
              transition-all select-none
              peer-checked:bg-surface peer-checked:text-foreground peer-checked:shadow-sm
              peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}
