"use client";

import { useState } from "react";

function formatThousands(digits: string): string {
  if (!digits) return "";
  return Number(digits).toLocaleString("tr-TR");
}

/** defaultValue yerine kullanılan, URL değiştiğinde (ör. Sıfırla) doğru
 * senkronize olan, yazarken binlik ayraç ("12.000") gösteren sayısal input
 * (bkz. PillCheckbox). Gönderilen değer sunucu tarafında (search.ts toInt)
 * noktalardan arındırılıp sayıya çevrilir. */
export function SyncedNumberInput({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue: number | "";
  placeholder?: string;
  className?: string;
}) {
  const digitsFromDefault = defaultValue === "" ? "" : String(defaultValue);
  const [digits, setDigits] = useState(digitsFromDefault);
  const [prevDigitsFromDefault, setPrevDigitsFromDefault] = useState(digitsFromDefault);

  if (digitsFromDefault !== prevDigitsFromDefault) {
    setPrevDigitsFromDefault(digitsFromDefault);
    setDigits(digitsFromDefault);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      value={formatThousands(digits)}
      onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
      placeholder={placeholder}
      className={className}
    />
  );
}
