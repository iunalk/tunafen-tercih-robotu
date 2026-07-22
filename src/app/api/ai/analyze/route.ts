import { NextRequest, NextResponse } from "next/server";
import { AI_MODEL, getGeminiClient } from "@/lib/gemini";
import { findCandidates, type StudentProfile } from "@/lib/ai/candidates";
import { formatCandidatesForPrompt, formatProfile, SYSTEM_PROMPT } from "@/lib/ai/prompt";

const TIERS = ["garanti", "gercekci", "hayali"] as const;

export async function POST(req: NextRequest) {
  const client = getGeminiClient();
  if (!client) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tanımlı değil. .env dosyasına Google AI Studio'dan aldığın ücretsiz API anahtarını ekleyin." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const profile = body.profile as StudentProfile;
  if (!profile?.scoreType || !profile?.rank) {
    return NextResponse.json({ error: "Puan türü ve başarı sırası gerekli." }, { status: 400 });
  }

  const candidates = await findCandidates(profile, 60);
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "Bu profile uygun aday program bulunamadı. Filtreleri gevşetmeyi deneyin." },
      { status: 404 }
    );
  }

  const userPrompt = `ÖĞRENCİ PROFİLİ:
${formatProfile(profile)}

ADAY PROGRAMLAR (başarı sırasına yakınlığa göre sıralı, ${candidates.length} adet):
${formatCandidatesForPrompt(candidates)}

Görev: YKS sisteminde öğrencinin toplamda 24 tercih hakkı vardır. Yukarıdaki aday programları,
öğrencinin bu 24 tercihi doldururken kullanabileceği üç kategoriye ayır:
- "garanti": Öğrencinin rahatlıkla, neredeyse kesin yerleşebileceği programlar (successRank öğrenci
  sıralamasından belirgin şekilde büyük, yani daha az rekabetçi).
- "gercekci": Öğrencinin sıralamasına yakın, gerçekçi ve dengeli hedef programlar.
- "hayali": Öğrencinin sıralamasının üstünde/yakınında, düşük ihtimalli ama YKS'nin doğası gereği
  "hayal" olarak birkaç tercihe eklenmeye değer, zorlayıcı programlar.

Toplamda en fazla 24 program öner ve bu 24'ü üç kategoriye öğrencinin profiline uygun şekilde dağıt
(örneğin dengeli bir profil için ~8 garanti, ~8 gerçekçi, ~8 hayali; ama gerekirse oranı değiştir).

Sadece geçerli JSON döndür, başka hiçbir metin ekleme. Şema:
{
  "summary": "1-2 cümlelik genel değerlendirme, 24 tercihlik dağılımdan kısaca bahset",
  "tiers": {
    "garanti": [{"programCode": "...", "reason": "kısa gerekçe"}],
    "gercekci": [{"programCode": "...", "reason": "kısa gerekçe"}],
    "hayali": [{"programCode": "...", "reason": "kısa gerekçe"}]
  }
}`;

  try {
    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI yanıtı ayrıştırılamadı.", raw: text }, { status: 502 });
    }
    const parsed = JSON.parse(jsonMatch[0]);

    const candidateByCode = new Map(candidates.map((c) => [c.programCode, c]));
    for (const tier of TIERS) {
      parsed.tiers[tier] = (parsed.tiers[tier] ?? []).map((item: { programCode: string; reason: string }) => ({
        ...item,
        candidate: candidateByCode.get(item.programCode) ?? null,
      }));
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("AI analyze error", err);
    const debug = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "AI isteği başarısız oldu.", debug }, { status: 502 });
  }
}
