// Utility to get current user's role
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

// cache() deduplicates calls within a single server render tree — the
// supabase.auth.getUser() + role query runs at most once per request even
// when multiple Server Components call getCurrentUser() in parallel.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, theme")
    .eq("user_id", user.id)
    .single();

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
  };
});

export function isOwner(role: UserRole) {
  return role === "owner";
}
