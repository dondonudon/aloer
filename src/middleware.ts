// Next.js middleware — must be in src/middleware.ts (or project root middleware.ts)
// and export a function named `middleware`. The previous proxy.ts file was not
// picked up by Next.js because it used the wrong filename and export name.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase auth session on every request and redirects
 * unauthenticated users to /login.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico and common image extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
