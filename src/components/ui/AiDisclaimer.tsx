function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FULL_TEXT =
  "Bu sayfadaki tercih değerlendirmeleri ve öneriler, geçmiş yıllara ait istatistiksel verilerin yapay zeka tarafından analiz edilmesiyle otomatik olarak oluşturulmuştur. Yapay zeka çıktıları hatalı, eksik veya güncelliğini yitirmiş bilgiler içerebilir. Bu nedenle oluşturulan listenin son halini mutlaka kendiniz gözden geçirmeli ve ayrıca bir rehber öğretmene veya alan uzmanına kontrol ettirmelisiniz. Bu önerilere dayanılarak yapılacak tercihlerin ve doğabilecek sonuçların sorumluluğu tamamen kullanıcıya aittir. Sistem, tercihlerinizi ÖSYM'ye iletmez veya kaydetmez; resmi tercih bildirimini ÖSYM'nin kendi sistemi üzerinden bizzat yapmanız gerekmektedir.";

const COMPACT_TEXT =
  "Bu içerik yapay zeka tarafından oluşturulmuştur ve hata içerebilir. Son kararı verirken kendi değerlendirmenizi kullanın ve bir uzmana da kontrol ettirin — sorumluluk size aittir. Tercihleriniz ÖSYM'ye otomatik olarak iletilmez.";

export function AiDisclaimer({ variant = "full" }: { variant?: "full" | "compact" }) {
  const text = variant === "full" ? FULL_TEXT : COMPACT_TEXT;
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <WarningIcon className="mt-0.5 shrink-0" />
      <p className={variant === "full" ? "text-sm leading-relaxed" : "text-xs leading-relaxed"}>
        <span className="font-bold">Önemli bilgilendirme: </span>
        {text}
      </p>
    </div>
  );
}
