// Browser client — runs in the browser, uses the user's session, RLS applies.
import { createBrowserClient } from "@supabase/ssr";

export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
