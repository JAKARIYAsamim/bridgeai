// Keeps the Supabase auth session fresh on every request so server components
// and route handlers (Story 4) see the logged-in user.
//
// In pure mock mode this is a zero-cost passthrough — no Supabase call — so the
// Phase 1 demo stays fast. It only does work once auth is live
// (NEXT_PUBLIC_DATA_MODE=live, or NEXT_PUBLIC_LIVE_SERVICES includes "auth").
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function authIsLive() {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "live") return true;
  const live = process.env.NEXT_PUBLIC_LIVE_SERVICES ?? "";
  return live.split(",").map((s) => s.trim()).includes("auth");
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!authIsLive() || !url || !key) return response; // mock mode: do nothing

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touch the session so expiring tokens get refreshed into the response cookies.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Run on pages, skip Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
