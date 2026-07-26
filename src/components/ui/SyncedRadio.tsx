"use client";

import { useState } from "react";

/** Tek bir radio için defaultChecked yerine kullanılan, URL değiştiğinde
 * doğru senkronize olan versiyon (bkz. PillCheckbox). */
export function SyncedRadio({
  name,
  value,
  defaultChecked,
  children,
  className,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [checked, setChecked] = useState(!!defaultChecked);
  const [prevDefaultChecked, setPrevDefaultChecked] = useState(!!defaultChecked);

  if (!!defaultChecked !== prevDefaultChecked) {
    setPrevDefaultChecked(!!defaultChecked);
    setChecked(!!defaultChecked);
  }

  return (
    <label className={`flex cursor-pointer items-center gap-1.5 ${className ?? ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="accent-accent"
      />
      {children}
    </label>
  );
}
