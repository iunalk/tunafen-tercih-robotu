import type { GenerateContentParameters } from "@google/genai";
import { GoogleGenAI } from "@google/genai";

// Ücretsiz katmandaki modeller, en yetenekliden en "hafif"e doğru sıralı.
// Bir model aşırı yoğunluk (503) ya da artık desteklenmiyor (404) hatası
// verirse otomatik olarak bir sonrakine geçilir.
export const AI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
] as const;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/** Modelleri sırayla dener; biri başarısız olursa (yoğunluk/kullanılamıyor) bir sonrakine geçer. */
export async function generateContentWithFallback(
  client: GoogleGenAI,
  params: Omit<GenerateContentParameters, "model">
) {
  let lastErr: unknown;
  for (const model of AI_MODELS) {
    try {
      return await client.models.generateContent({ ...params, model });
    } catch (err) {
      lastErr = err;
      console.error(`Gemini modeli '${model}' başarısız oldu, sıradaki denenecek:`, err);
    }
  }
  throw lastErr;
}
