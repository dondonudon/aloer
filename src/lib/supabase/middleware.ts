// Supabase middleware for session refresh
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or ANON_KEY env vars");
  }
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Fast path: read the session from the signed cookie (local JWT decode, no
  // network round-trip). Only fall through to getUser() — which contacts the
  // Supabase auth server — when the token is within 60 s of expiry and needs
  // a refresh. For most page loads this cuts proxy latency from ~80 ms to <1 ms.
  //
  // Security note: getSession() trusts the JWT signature but does not check
  // server-side revocation. Actual data access (Server Components, Actions)
  // still calls getCurrentUser() → getUser() which validates with Supabase.
  // The middleware only needs user presence for redirect logic.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const tokenExp = session?.expires_at ?? 0;
  const secondsUntilExpiry = tokenExp - Math.floor(Date.now() / 1000);
  const needsRefresh = !session || secondsUntilExpiry < 60;

  let user = session?.user ?? null;
  if (needsRefresh) {
    // Token is missing or close to expiry — hit the auth server to refresh.
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // Redirect unauthenticated users to login (except auth pages)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
