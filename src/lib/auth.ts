// Utility to get current user's role

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

// Cached user profile (role, theme, locale) keyed by user ID.
// Uses admin client so it's not bound to request-scoped cookies.
// TTL: 60s — revalidate by calling revalidateTag(`user-${userId}`) when
// the user_roles row changes (theme, locale, or role updates).
function fetchUserProfile(userId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      const { data } = await admin
        .from("user_roles")
        .select("role, theme, locale")
        .eq("user_id", userId)
        .single();
      return data ?? null;
    },
    [`user-profile-${userId}`],
    { revalidate: 60, tags: [`user-${userId}`] },
  )();
}

// cache() deduplicates calls within a single server render tree — the
// supabase.auth.getUser() runs at most once per request even when multiple
// Server Components call getCurrentUser() in parallel.
// The user_roles query is served from the Next.js data cache (60s TTL),
// eliminating the second sequential DB roundtrip on every request.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const roleData = await fetchUserProfile(user.id);

  // No role row = not an authorised user, treat as unauthenticated
  if (!roleData) return null;

  const name: string =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "";

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    role: roleData.role as UserRole,
    theme: (roleData.theme ?? null) as "light" | "dark" | null,
    locale: (roleData.locale ?? null) as "en" | "id" | null,
  };
});

export function isOwner(role: UserRole) {
  return role === "owner";
}
