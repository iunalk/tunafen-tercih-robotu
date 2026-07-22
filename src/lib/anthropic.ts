import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = "claude-sonnet-5";

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}
