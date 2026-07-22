import { NextRequest, NextResponse } from "next/server";
import { generateContentWithFallback, getGeminiClient } from "@/lib/gemini";
import { findCandidates, type StudentProfile } from "@/lib/ai/candidates";
import { formatCandidatesForPrompt, formatProfile, SYSTEM_PROMPT } from "@/lib/ai/prompt";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const client = getGeminiClient();
  if (!client) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tanımlı değil. .env dosyasına Google AI Studio'dan aldığın ücretsiz API anahtarını ekleyin." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const profile = body.profile as StudentProfile | undefined;
  const messages = body.messages as ChatMessage[];

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mesaj gerekli." }, { status: 400 });
  }

  let contextBlock = "Öğrenci henüz profil bilgisi (puan türü/sıralama) girmedi; genel bilgi ver ve profil girmesini öner.";
  if (profile?.scoreType && profile?.rank) {
    const candidates = await findCandidates(profile, 80);
    contextBlock = `ÖĞRENCİ PROFİLİ:\n${formatProfile(profile)}\n\nADAY PROGRAMLAR (${candidates.length} adet):\n${formatCandidatesForPrompt(candidates)}`;
  }

  try {
    const response = await generateContentWithFallback(client, {
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text ?? "";
    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("AI chat error", err);
    return NextResponse.json({ error: "AI isteği başarısız oldu." }, { status: 502 });
  }
}
