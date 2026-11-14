// Live-mode store helpers. Live data lives in Supabase, so there's nothing local to
// reset, but we DO wire Realtime here: one shared channel watches the demo tables and
// pokes every screen's loader (useLoad subscribes via subscribeToData) to re-fetch.
// RLS applies to Realtime too, so each client is only told about rows it may see.
"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const TABLES = [
  "activity_logs", "daily_checkins", "feedback", "feedback_replies",
  "alerts", "roadmaps", "plan_items", "goals", "reports",
];

const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;

function ensureChannel() {
  if (channel) return;
  const sb = supabaseBrowser();
  channel = sb.channel("bridgeai-live");
  const notify = () => listeners.forEach((l) => l());
  for (const table of TABLES) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, notify);
  }
  channel.subscribe();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  try { ensureChannel(); } catch { /* realtime unavailable — screens still work via manual reload */ }
  return () => { listeners.delete(fn); };
}

export const getRev = () => 0; // reactivity comes from the channel, not a revision counter
export const resetDB = async () => {}; // can't reset the shared DB from the client
