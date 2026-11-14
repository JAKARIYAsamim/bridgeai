// Safety keyword check. Runs in plain code, before and separately from any AI.
// A clinician and a native Bangla speaker should expand this list before real use.

export const SAFETY_KEYWORDS: string[] = [
  // English
  "injury", "injuries", "injured", "seizure", "seizures", "had a fit", "convulsion", "convulsions", "blood", "bleeding", "self-harm", "self harm",
  "hurt himself", "hurt herself", "hurting himself", "hurting herself", "head-banging", "head banging",
  "banging his head", "banging her head", "abuse", "can't cope", "cannot cope", "cant cope", "choking", "unconscious",
  // Bangla
  "আঘাত", "খিঁচুনি", "রক্ত", "মাথা ঠুকে", "মাথা ঠোকে", "আর পারছি না", "নিজেকে কামড়", "অজ্ঞান", "শ্বাস বন্ধ",
];

/** Returns the first keyword found, or null. */
export function findSafetyKeyword(text: string | undefined | null): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const k of SAFETY_KEYWORDS) {
    if (/^[a-z' -]+$/.test(k)) {
      // whole-word match for English so "fit" doesn't match "benefit"
      const re = new RegExp(`(^|[^a-z])${k.replace(/[-]/g, "[- ]?")}([^a-z]|$)`, "i");
      if (re.test(t)) return k;
    } else if (t.includes(k)) {
      return k;
    }
  }
  return null;
}
