// POST /api/ai/voice — transcribe + summarize a parent's voice note.
// Body: { audioBase64, mimeType } for real audio, or { text } to just summarize text.
// Any logged-in user may call it (parents record feedback). Server-side keeps the key safe.
import { NextResponse } from "next/server";
import { geminiJson } from "@/lib/ai/gemini";
import { supabaseServer } from "@/lib/supabase/server";

type VoiceResult = { transcript: string; summary_en: string; summary_bn: string; flags: string[] };

export async function POST(request: Request) {
  const { audioBase64, mimeType, text } = (await request.json()) as
    { audioBase64?: string; mimeType?: string; text?: string };

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  if (!audioBase64 && !text) {
    return NextResponse.json({ transcript: "", summary_en: "", summary_bn: "", flags: [] } satisfies VoiceResult);
  }

  const instruction = `A parent in Bangladesh left a note about their autistic child's day. Mostly Bangla.
Return ONLY JSON: { "transcript": string, "summary_en": string, "summary_bn": string, "flags": string[] }.
- transcript: the words (Bangla script if spoken in Bangla). If text was provided, clean it up lightly.
- summary_en / summary_bn: one short sentence each.
- flags: any of "success", "struggle", "question", "safety_concern". [] if none.`;

  const contents = audioBase64
    ? [{ inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } }, { text: instruction }]
    : `${instruction}\n\nPARENT TEXT: ${text}`;

  try {
    const res = await geminiJson<VoiceResult>(contents, 25000);
    return NextResponse.json({
      transcript: res.transcript ?? "", summary_en: res.summary_en ?? "",
      summary_bn: res.summary_bn ?? "", flags: Array.isArray(res.flags) ? res.flags : [],
    } satisfies VoiceResult);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
