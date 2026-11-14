// SERVER ONLY. Thin Gemini wrapper for the AI routes. `server-only` throws if this
// is ever imported into client code, so the API key can't leak to the browser.
import "server-only";
import { GoogleGenAI, type ContentListUnion } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

// gemini-3.5-flash-lite is the deliberate pick: the full flash models hang with a
// 503 under load. The race caps every call so a busy model can't hang a request.
async function run(contents: ContentListUnion, timeoutMs: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const call = ai.models.generateContent({
    model: MODEL, contents, config: { responseMimeType: "application/json" },
  });
  const res = await Promise.race([
    call,
    new Promise<never>((_, r) => setTimeout(() => r(new Error("The AI is busy right now. Please try again.")), timeoutMs)),
  ]);
  return (res.text ?? "").trim();
}

const stripFence = (s: string) => s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

/** Ask Gemini for JSON and parse it. Throws friendly errors the route can forward. */
export async function geminiJson<T>(contents: ContentListUnion, timeoutMs = 22000): Promise<T> {
  const text = await run(contents, timeoutMs);
  try {
    return JSON.parse(stripFence(text)) as T;
  } catch {
    throw new Error("The AI returned an unexpected format. Please try again.");
  }
}
