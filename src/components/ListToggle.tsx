"use client";

import { useEffect, useState } from "react";
import { LIST_KEYS, readLists, subscribeLists, toggleInList } from "@/lib/lists";

export function ListToggle({ programId }: { programId: number }) {
  const [active, setActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => {
      const lists = readLists();
      setActive({
        L1: lists.L1.includes(programId),
        L2: lists.L2.includes(programId),
        L3: lists.L3.includes(programId),
      });
    };
    sync();
    return subscribeLists(sync);
  }, [programId]);

  return (
    <div className="flex gap-1 rounded-full border border-border bg-surface-muted p-0.5">
      {LIST_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => toggleInList(programId, key)}
          title={`${key} listesine ekle/çıkar`}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
            active[key]
              ? "bg-accent text-accent-foreground shadow-[var(--shadow-sm)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
