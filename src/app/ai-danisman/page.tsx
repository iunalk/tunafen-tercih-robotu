"use client";

import { useEffect, useState } from "react";
import { ScoreType } from "@/generated/prisma/enums";
import { AiDisclaimer } from "@/components/ui/AiDisclaimer";
import { AppHeader } from "@/components/ui/AppHeader";
import { Badge } from "@/components/ui/Badge";
import { SCORE_TYPE_LABELS } from "@/lib/labels";

interface Candidate {
  programCode: string;
  university: string;
  city: string;
  name: string;
  faculty: string | null;
  successRank: number;
  minScore: number | null;
}

interface TierItem {
  programCode: string;
  reason: string;
  candidate: Candidate | null;
}

interface AnalyzeResult {
  summary: string;
  tiers: { garanti: TierItem[]; gercekci: TierItem[]; hayali: TierItem[] };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const TIER_LABELS: Record<keyof AnalyzeResult["tiers"], string> = {
  garanti: "Garanti",
  gercekci: "Gerçekçi",
  hayali: "Hayali",
};

const TIER_DESCRIPTIONS: Record<keyof AnalyzeResult["tiers"], string> = {
  garanti: "Rahatlıkla yerleşebileceğin programlar",
  gercekci: "Sıralamana yakın, dengeli hedefler",
  hayali: "Zorlayıcı ama denemeye değer seçimler",
};

const TIER_STYLES: Record<keyof AnalyzeResult["tiers"], { bar: string; dot: string }> = {
  garanti: { bar: "border-l-emerald-500", dot: "bg-emerald-500" },
  gercekci: { bar: "border-l-amber-500", dot: "bg-amber-500" },
  hayali: { bar: "border-l-rose-500", dot: "bg-rose-500" },
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-ring/30";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

export default function AiDanismanPage() {
  const [tab, setTab] = useState<"analiz" | "sohbet">("analiz");
  const [scoreType, setScoreType] = useState<ScoreType>(ScoreType.SAY);
  const [rank, setRank] = useState("");
  const [city, setCity] = useState("");
  const [interest, setInterest] = useState("");

  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [transferredIds, setTransferredIds] = useState<number[] | null>(null);

  useEffect(() => {
    function loadTransferred() {
      try {
        const raw = window.localStorage.getItem("tunafen:aiTransfer");
        if (raw) {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids) && ids.length > 0) setTransferredIds(ids);
        }
      } catch {
        // yoksay
      }
    }
    loadTransferred();
  }, []);

  function clearTransferred() {
    window.localStorage.removeItem("tunafen:aiTransfer");
    setTransferredIds(null);
  }

  function currentProfile() {
    return {
      scoreType,
      rank: Number.parseInt(rank, 10),
      city: city.trim() || undefined,
      interest: interest.trim() || undefined,
    };
  }

  async function runAnalyze() {
    setAnalyzeError(null);
    setResult(null);
    if (!rank) {
      setAnalyzeError("Lütfen başarı sıranı gir.");
      return;
    }
    setAnalyzeLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: currentProfile(), programIds: transferredIds ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error ?? "Bilinmeyen hata");
        return;
      }
      setResult(data);
    } catch {
      setAnalyzeError("Sunucuya ulaşılamadı.");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    setChatError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: rank ? currentProfile() : undefined, messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error ?? "Bilinmeyen hata");
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setChatError("Sunucuya ulaşılamadı.");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader active="/ai-danisman" subtitle="Profiline göre AI destekli tercih analizi" />

      <div className="mx-auto w-full max-w-[1300px] px-4 pt-4 sm:px-6 sm:pt-6">
        <AiDisclaimer variant="full" />
      </div>

      <main className="mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-md)] lg:sticky lg:top-[84px] lg:w-80 lg:shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3Z" strokeLinejoin="round" />
                <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-semibold text-foreground">Profilin</h2>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Puan Türü</span>
            <select
              value={scoreType}
              onChange={(e) => setScoreType(e.target.value as ScoreType)}
              className={inputClass}
            >
              {Object.values(ScoreType).map((v) => (
                <option key={v} value={v}>
                  {SCORE_TYPE_LABELS[v]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Başarı Sıran</span>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              placeholder="örn. 50000"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Şehir Tercihi <span className="normal-case text-muted-foreground/70">(opsiyonel)</span>
            </span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="örn. İSTANBUL"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              İlgi Alanı <span className="normal-case text-muted-foreground/70">(opsiyonel)</span>
            </span>
            <input
              type="text"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="örn. bilgisayar mühendisliği"
              className={inputClass}
            />
          </label>

          <div className="flex gap-1 rounded-lg border border-border bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setTab("analiz")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                tab === "analiz" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Analiz
            </button>
            <button
              type="button"
              onClick={() => setTab("sohbet")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                tab === "sohbet" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sohbet
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {tab === "analiz" ? (
            <div className="flex flex-col gap-5">
              {transferredIds ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-2.5 text-sm text-accent">
                  <span>
                    <span className="font-semibold">{transferredIds.length} program</span> arama sayfasından aktarıldı
                    — analiz bu listeye göre yapılacak.
                  </span>
                  <button type="button" onClick={clearTransferred} className="text-xs font-medium underline hover:no-underline">
                    Aktarılan listeyi kaldır
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runAnalyze}
                  disabled={analyzeLoading}
                  className="flex w-fit items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-accent-hover disabled:opacity-60"
                >
                  {analyzeLoading ? <Spinner /> : null}
                  {analyzeLoading ? "Analiz ediliyor..." : "Tercihlerimi Analiz Et"}
                </button>
                <span className="text-xs text-muted-foreground">
                  YKS&apos;de toplam <span className="font-semibold text-foreground">24 tercih hakkın</span> var —
                  öneriler bu 24 tercihi Garanti / Gerçekçi / Hayali dengesiyle doldurmana yardımcı olur.
                </span>
              </div>

              {analyzeError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  {analyzeError}
                </p>
              ) : null}

              {!result && !analyzeLoading && !analyzeError ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
                  Profilini soldaki forma gir ve &quot;Tercihlerimi Analiz Et&quot;e bas — AI, sıralamana yakın
                  programları Garanti / Gerçekçi / Hayali olarak sınıflandırıp gerekçelendirsin.
                </div>
              ) : null}

              {result ? (
                <div className="flex flex-col gap-6">
                  <AiDisclaimer variant="compact" />
                  <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-foreground shadow-[var(--shadow-sm)]">
                    {result.summary}
                  </p>
                  {(Object.keys(TIER_LABELS) as (keyof AnalyzeResult["tiers"])[]).map((tier) => (
                    <div key={tier} className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${TIER_STYLES[tier].dot}`} />
                        <h3 className="font-bold text-foreground">{TIER_LABELS[tier]}</h3>
                        <span className="text-xs text-muted-foreground">{TIER_DESCRIPTIONS[tier]}</span>
                      </div>
                      {result.tiers[tier].length === 0 ? (
                        <p className="text-sm text-muted-foreground">Bu kategoride öneri yok.</p>
                      ) : (
                        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                          {result.tiers[tier].map((item) => (
                            <div
                              key={item.programCode}
                              className={`flex flex-col gap-1.5 rounded-xl border border-border border-l-4 bg-surface p-3.5 shadow-[var(--shadow-sm)] ${TIER_STYLES[tier].bar}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-semibold text-foreground">
                                  {item.candidate ? item.candidate.university : item.programCode}
                                </div>
                                <Badge tone="neutral" className="font-mono">
                                  {item.programCode}
                                </Badge>
                              </div>
                              {item.candidate ? (
                                <>
                                  <div className="text-sm text-muted-foreground">{item.candidate.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.candidate.city} · Sıra {item.candidate.successRank}
                                    {item.candidate.minScore ? ` · ${item.candidate.minScore.toFixed(3)} puan` : ""}
                                  </div>
                                </>
                              ) : null}
                              <p className="mt-1 text-sm text-foreground/90">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[70vh] flex-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-md)]">
              <AiDisclaimer variant="compact" />
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-1">
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path
                          d="M21 15a4 4 0 01-4 4H8l-5 3V6a4 4 0 014-4h10a4 4 0 014 4v9Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Tercihlerinle ilgili merak ettiğin her şeyi sorabilirsin. Örn: &quot;Sıralamam 80000,
                      İzmir&apos;de burslu mühendislik önerir misin?&quot;
                    </p>
                  </div>
                ) : null}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-[var(--shadow-sm)] ${
                      m.role === "user"
                        ? "self-end rounded-br-sm bg-accent text-accent-foreground"
                        : "self-start rounded-bl-sm border border-border bg-surface-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {chatLoading ? (
                  <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm border border-border bg-surface-muted px-4 py-2.5 text-sm text-muted-foreground">
                    <Spinner /> Yazıyor...
                  </div>
                ) : null}
                {chatError ? <p className="text-sm text-rose-600 dark:text-rose-400">{chatError}</p> : null}
              </div>
              <div className="flex gap-2 border-t border-border pt-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChat();
                  }}
                  placeholder="Bir soru yaz..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={sendChat}
                  disabled={chatLoading}
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-accent-hover disabled:opacity-60"
                >
                  Gönder
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
