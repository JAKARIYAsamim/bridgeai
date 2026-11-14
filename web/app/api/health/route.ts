// Story 1 smoke test: confirms Supabase reachable + whether the Gemini key works.
// Delete or protect before the demo (Step 11). Visit /api/health.
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  // Dev-only probe. In production it 404s so nobody can burn Gemini calls against it.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const out: Record<string, string> = {};

  // Supabase: a session lookup that must not error (null session is fine)
  try {
    const sb = await supabaseServer();
    const { error } = await sb.auth.getSession();
    out.supabase = error ? `error: ${error.message}` : "ok";
  } catch (e) {
    out.supabase = `error: ${(e as Error).message}`;
  }

  // Gemini: one tiny call, capped at 12s so a "high demand" 503 can't hang the endpoint.
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const call = ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
      contents: "Reply with exactly: OK",
    });
    const res = await Promise.race([
      call,
      new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout after 12s (model busy?)")), 12000)),
    ]);
    out.gemini = (res.text ?? "").trim().toLowerCase().includes("ok") ? "ok" : `unexpected: ${res.text}`;
  } catch (e) {
    out.gemini = `error: ${(e as Error).message}`;
  }

  return NextResponse.json(out);
}
