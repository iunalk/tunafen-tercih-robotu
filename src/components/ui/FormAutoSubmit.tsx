"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Bulunduğu <form>'a bağlanır; checkbox/radio/select değiştiğinde veya form
 * submit edildiğinde formu native GET yerine Next.js router.push ile
 * (scroll: false) gönderir — böylece filtre değiştirdiğinde sayfa en yukarı
 * atmaz, kullanıcı kaldığı yerde kalır.
 *
 * Checkbox'lar için kısa bir debounce uygulanır: aynı listede art arda
 * birkaç kutu işaretlenirse (örn. 3 şehir seçmek), her tıklamada ayrı
 * gönderim yerine son tıklamadan kısa bir süre sonra TEK seferde gönderilir.
 * Radio/select tek seçimlik olduğu için hemen gönderilir.
 */
export function FormAutoSubmit({ debounceMs = 500 }: { debounceMs?: number }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  useEffect(() => {
    const form = anchorRef.current?.closest("form");
    if (!form) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    function submitViaRouter() {
      const formData = new FormData(form as HTMLFormElement);
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && value !== "") params.append(key, value);
      }
      router.push(`/?${params.toString()}`, { scroll: false });
    }

    const changeHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const isRadioOrSelect = target.matches('input[type="radio"]') || target.tagName === "SELECT";
      const isCheckbox = target.matches('input[type="checkbox"]');
      if (!isRadioOrSelect && !isCheckbox) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(submitViaRouter, isRadioOrSelect ? 0 : debounceMs);
    };

    const submitHandler = (e: Event) => {
      e.preventDefault();
      if (timer) clearTimeout(timer);
      submitViaRouter();
    };

    form.addEventListener("change", changeHandler);
    form.addEventListener("submit", submitHandler);
    return () => {
      if (timer) clearTimeout(timer);
      form.removeEventListener("change", changeHandler);
      form.removeEventListener("submit", submitHandler);
    };
  }, [debounceMs, router]);

  return <span ref={anchorRef} className="hidden" aria-hidden />;
}
