import { GoogleGenAI } from "@google/genai";

// Google AI Studio (ai.google.dev) model listesinden ücretsiz katmandaki
// güncel "flash" modelini seçebilirsin; gerekirse burada değiştir.
export const AI_MODEL = "gemini-3.5-flash";

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}
