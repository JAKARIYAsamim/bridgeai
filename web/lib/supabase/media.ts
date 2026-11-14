// Browser-only helpers for the private "media" storage bucket. RLS on
// storage.objects requires the path to be "<childId>/<category>/<file>" —
// see the media_upload/media_read policies.
"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "./client";

const BUCKET = "media";

/** Upload a recorded/picked file and return its storage PATH (not a URL — the
 * bucket is private, so playback needs a signed URL resolved at display time). */
export async function uploadMedia(
  childId: string,
  category: "voice" | "photo" | "video" | "checkin",
  blob: Blob,
  ext: string,
): Promise<string> {
  const path = `${childId}/${category}/${Date.now()}.${ext}`;
  // Strip codec params (e.g. "audio/webm;codecs=opus") — the bucket's allowed_mime_types
  // only lists the bare type and won't match the parameterized form.
  const contentType = blob.type ? blob.type.split(";")[0].trim() : undefined;
  const { error } = await supabaseBrowser().storage.from(BUCKET).upload(path, blob, { contentType });
  if (error) throw new Error(error.message);
  return path;
}

const looksLikeUrl = (s: string) => /^(https?:|blob:|data:|\/)/.test(s);

/** Turn a stored media path into a short-lived signed URL. Already-usable
 * values (demo assets, blob/data URLs from the same session) pass through. */
export async function resolveMediaUrl(path: string, expiresIn = 3600): Promise<string> {
  if (looksLikeUrl(path)) return path;
  const { data, error } = await supabaseBrowser().storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** React hook: resolves a stored media path to a playable URL. */
export function useMediaUrl(path?: string | null): string | undefined {
  const [url, setUrl] = useState<string | undefined>(path && looksLikeUrl(path) ? path : undefined);
  useEffect(() => {
    if (!path) { setUrl(undefined); return; }
    if (looksLikeUrl(path)) { setUrl(path); return; }
    let live = true;
    resolveMediaUrl(path).then((u) => { if (live) setUrl(u); }).catch(() => { if (live) setUrl(undefined); });
    return () => { live = false; };
  }, [path]);
  return url;
}
