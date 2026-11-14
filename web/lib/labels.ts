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
  preverbal: { en: "Pre-verbal", bn: "কথা শুরুর আগে" },
  words_gestures: { en: "Words or gestures", bn: "শব্দ বা ইশারা" },
  phrases: { en: "Phrases", bn: "ছোট বাক্য" },
  conversational: { en: "Conversational", bn: "কথোপকথন" },
  aac: { en: "Pictures or AAC", bn: "ছবি বা পিকচার কার্ড" },
};

export const SENSORY_FLAGS: Record<string, Pair> = {
  noise: { en: "Noise", bn: "শব্দ সংবেদনশীল" },
  touch: { en: "Touch", bn: "স্পর্শ সংবেদনশীল" },
  light: { en: "Light", bn: "আলো সংবেদনশীল" },
  food_textures: { en: "Food textures", bn: "খাবারের টেক্সচার" },
};

export const SAFETY_FLAGS: Record<string, Pair> = {
  wanders_off: { en: "Wanders off", bn: "একা চলে যায়" },
  mouthing: { en: "Puts objects in mouth", bn: "মুখে জিনিস দেয়" },
  self_injury: { en: "Self-injury", bn: "নিজের ক্ষতি করে" },
  seizures: { en: "Seizures", bn: "খিঁচুনি" },
  food_allergy: { en: "Food allergy", bn: "খাবারে অ্যালার্জি" },
};

export const MOODS: Record<Mood, { emoji: string; en: string; bn: string }> = {
  happy: { emoji: "😀", en: "Went well", bn: "ভালো হয়েছে" },
  neutral: { emoji: "😐", en: "Okay", bn: "মোটামুটি" },
  sad: { emoji: "😟", en: "Hard", bn: "কঠিন ছিল" },
};

export const FEEDBACK_FLAGS: Record<string, { en: string; bn: string; tone: "success" | "info" | "celebrate" | "alert" | "muted" }> = {
  success: { en: "Success", bn: "সফল", tone: "success" },
  refused: { en: "Refused", bn: "করতে চায়নি", tone: "muted" },
  upset: { en: "Upset", bn: "অস্থির ছিল", tone: "celebrate" },
  new_concern: { en: "New concern", bn: "নতুন উদ্বেগ", tone: "info" },
  safety_concern: { en: "Safety concern", bn: "নিরাপত্তা ঝুঁকি", tone: "alert" },
  caregiver_stress: { en: "Caregiver stress", bn: "অভিভাবকের চাপ", tone: "info" },
};

export const PROFESSIONS_DATA: Record<string, Pair> = {
  "Developmental paediatrician": { en: "Developmental paediatrician", bn: "শিশু বিকাশ বিশেষজ্ঞ" },
  "Psychologist": { en: "Psychologist", bn: "মনোবিজ্ঞানী" },
  "Occupational therapist": { en: "Occupational therapist", bn: "অকুপেশনাল থেরাপিস্ট" },
  "Speech therapist": { en: "Speech therapist", bn: "স্পিচ থেরাপিস্ট" },
  "Special educator": { en: "Special educator", bn: "স্পেশাল এডুকেটর" },
  "Other": { en: "Other", bn: "অন্যান্য" },
};

export const PROFESSIONS = [
  "Developmental paediatrician",
  "Psychologist",
  "Occupational therapist",
  "Speech therapist",
  "Special educator",
  "Other",
];

export const DIFFICULTY: Record<number, Pair> = {
  1: { en: "Step 1 · adult shows", bn: "ধাপ ১ · আপনি দেখাবেন" },
  2: { en: "Step 2 · partial help", bn: "ধাপ ২ · একটু সাহায্য" },
  3: { en: "Step 3 · child alone", bn: "ধাপ ৩ · শিশু নিজে" },
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const bnNum = (s: string | number) => String(s).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
export const num = (n: string | number, lang: Lang) => (lang === "bn" ? bnNum(n) : String(n));

const BN_NAMES: Record<string, string> = {
  Rafi: "রাফি",
  Mitu: "মিতু",
  Ayesha: "আয়েশা",
  Karim: "করিম",
  "Dr. Nasrin": "ডা. নাসরিন",
  Nasrin: "নাসরিন",
  Farhana: "ফারহানা",
  "Tanvir Hasan": "তানভীর হাসান",
  Tanvir: "তানভীর",
  "Sadia Rahman": "সাদিয়া রহমান",
  Sadia: "সাদিয়া",
  Shirin: "শিরীন",
  Habib: "হাবিব",
  Rokeya: "রোকেয়া",
  Nabil: "নাবিল",
  Tasnim: "তাসনিম",
  Nusrat: "নুসরাত",
  "Hope Therapy Centre": "হোপ থেরাপি সেন্টার",
  "Chattogram Child Development Centre": "চট্টগ্রাম শিশু বিকাশ কেন্দ্র",
  Dhaka: "ঢাকা",
  Chattogram: "চট্টগ্রাম",
};

export const nameIn = (name: string, lang: Lang) => {
  if (!name) return "";
  if (lang !== "bn") return name;
  if (BN_NAMES[name]) return BN_NAMES[name];
  if (name.startsWith("Dr. ") || name.startsWith("Dr ")) {
    const rest = name.replace(/^Dr\.?\s+/, "");
    return `ডা. ${BN_NAMES[rest] ?? rest}`;
  }
  return BN_NAMES[name] ?? name;
};

export const fmtDate = (iso: string, lang: Lang = "bn", opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  if (isNaN(d.getTime())) return iso;
  const str = d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", opts);
  return lang === "bn" ? bnNum(str) : str;
};

export const fmtTime = (iso: string, lang: Lang = "bn") => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const str = d.toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-GB", { hour: "numeric", minute: "2-digit" });
  return lang === "bn" ? bnNum(str) : str;
};

export const ago = (iso: string, lang: Lang = "bn") => {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (lang === "bn") {
    if (m < 60) return `${bnNum(m)} মিনিট আগে`;
    const h = Math.round(m / 60);
    if (h < 24) return `${bnNum(h)} ঘণ্টা আগে`;
    const d = Math.round(h / 24);
    return `${bnNum(d)} দিন আগে`;
  }
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};
