// Display labels for enum values, in English and Bangla.
import type { AgeBand, CommLevel, Domain, Lang, Mood, RoutineSlot } from "@/lib/types";

type Pair = { en: string; bn: string };

export const DOMAINS: Record<Domain, Pair & { emoji: string; tint: string }> = {
  communication: { en: "Communication", bn: "যোগাযোগ", emoji: "💬", tint: "blue" },
  social: { en: "Social engagement", bn: "একসাথে খেলা", emoji: "🫧", tint: "pink" },
  imitation_play: { en: "Imitation and play", bn: "অনুকরণ ও খেলা", emoji: "🧸", tint: "orange" },
  sensory: { en: "Sensory and regulation", bn: "অনুভূতি ও শান্ত থাকা", emoji: "🌿", tint: "green" },
  daily_living: { en: "Daily living", bn: "দৈনন্দিন কাজ", emoji: "🧼", tint: "blue" },
  behaviour: { en: "Behaviour and transitions", bn: "আচরণ ও পরিবর্তন", emoji: "⏳", tint: "purple" },
  motor: { en: "Motor", bn: "চলাফেরা", emoji: "🤸", tint: "orange" },
  early_learning: { en: "Early learning", bn: "প্রাথমিক শেখা", emoji: "🔤", tint: "yellow" },
  caregiver_wellbeing: { en: "Caregiver wellbeing", bn: "আপনার যত্ন", emoji: "🌸", tint: "pink" },
};

export const SLOTS: Record<RoutineSlot, Pair & { emoji: string; order: number }> = {
  morning: { en: "Morning", bn: "সকাল", emoji: "🌅", order: 1 },
  mealtime: { en: "Mealtime", bn: "খাবারের সময়", emoji: "🍚", order: 2 },
  bath_toilet: { en: "Bath or toilet", bn: "গোসল / বাথরুম", emoji: "🛁", order: 3 },
  play: { en: "Play", bn: "খেলার সময়", emoji: "🎈", order: 4 },
  outing: { en: "Outing", bn: "বাইরে যাওয়া", emoji: "🚶", order: 5 },
  bedtime: { en: "Bedtime", bn: "ঘুমের সময়", emoji: "🌙", order: 6 },
  any: { en: "Any time", bn: "যেকোনো সময়", emoji: "✨", order: 7 },
};

export const AGE_BANDS: Record<AgeBand, Pair> = {
  under_3: { en: "Under 3", bn: "৩ বছরের কম" },
  "3_5": { en: "3–5", bn: "৩–৫ বছর" },
  "6_9": { en: "6–9", bn: "৬–৯ বছর" },
  "10_plus": { en: "10+", bn: "১০+ বছর" },
};

export const COMM_LEVELS: Record<CommLevel, Pair> = {
  preverbal: { en: "Pre-verbal", bn: "কথা বলার আগের ধাপ" },
  words_gestures: { en: "Words or gestures", bn: "শব্দ বা ইশারা" },
  phrases: { en: "Phrases", bn: "ছোট বাক্য" },
  conversational: { en: "Conversational", bn: "কথোপকথন" },
  aac: { en: "Pictures or AAC", bn: "ছবি বা AAC" },
};

export const SENSORY_FLAGS: Record<string, string> = { noise: "Noise", touch: "Touch", light: "Light", food_textures: "Food textures" };
export const SAFETY_FLAGS: Record<string, string> = {
  wanders_off: "Wanders off", mouthing: "Puts objects in mouth", self_injury: "Self-injury", seizures: "Seizures", food_allergy: "Food allergy",
};

export const MOODS: Record<Mood, { emoji: string; en: string; bn: string }> = {
  happy: { emoji: "😀", en: "Went well", bn: "ভালো হয়েছে" },
  neutral: { emoji: "😐", en: "Okay", bn: "মোটামুটি" },
  sad: { emoji: "😟", en: "Hard", bn: "কঠিন ছিল" },
};

export const FEEDBACK_FLAGS: Record<string, { en: string; tone: "success" | "info" | "celebrate" | "alert" | "muted" }> = {
  success: { en: "Success", tone: "success" },
  refused: { en: "Refused", tone: "muted" },
  upset: { en: "Upset", tone: "celebrate" },
  new_concern: { en: "New concern", tone: "info" },
  safety_concern: { en: "Safety concern", tone: "alert" },
  caregiver_stress: { en: "Caregiver stress", tone: "info" },
};

export const PROFESSIONS = [
  "Developmental paediatrician", "Psychologist", "Occupational therapist", "Speech therapist", "Special educator", "Other",
];

export const DIFFICULTY: Record<number, Pair> = {
  1: { en: "Step 1 · adult shows", bn: "ধাপ ১ · আপনি দেখাবেন" },
  2: { en: "Step 2 · partial help", bn: "ধাপ ২ · একটু সাহায্য" },
  3: { en: "Step 3 · child alone", bn: "ধাপ ৩ · শিশু নিজে" },
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const bnNum = (s: string | number) => String(s).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
export const num = (n: string | number, lang: Lang) => (lang === "bn" ? bnNum(n) : String(n));

const BN_NAMES: Record<string, string> = { Rafi: "রাফি", Mitu: "মিতু", Ayesha: "আয়েশা", Karim: "করিম", "Dr. Nasrin": "ডাক্তার নাসরিন", Nabil: "নাবিল", Tasnim: "তাসনিম" };
export const nameIn = (name: string, lang: Lang) => (lang === "bn" ? BN_NAMES[name] ?? name : name);

export const fmtDate = (iso: string, lang: Lang = "en", opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", opts);
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
export const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};
