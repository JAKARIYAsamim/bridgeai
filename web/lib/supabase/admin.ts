// Admin client — SERVER ONLY. Bypasses RLS with the service-role key.
// Use only in AI routes, cron and seed scripts. `server-only` throws if imported in the browser.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
