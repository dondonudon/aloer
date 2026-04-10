"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getCurrentUser, isOwner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

/**
 * Persists the calling user's theme preference to their user_roles row.
 * Any authenticated user can update their own theme — no role restriction.
 */
export async function saveTheme(theme: "light" | "dark"): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_roles").update({ theme }).eq("user_id", user.id);
  revalidateTag(`user-${user.id}`, { expire: 0 });
}

/**
 * Persists the calling user's locale preference to their user_roles row.
 * Any authenticated user can update their own locale — no role restriction.
 */
export async function saveLocale(locale: "en" | "id"): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_roles").update({ locale }).eq("user_id", user.id);
  revalidateTag(`user-${user.id}`, { expire: 0 });
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  created_at: string;
}

// Cached list of auth users + roles.
// admin.auth.admin.listUsers() is an external Supabase Admin API call (~200ms).
// Cache for 30 s; revalidated by tag whenever a role changes.
const _getCachedUsers = unstable_cache(
  async (): Promise<ManagedUser[]> => {
    const admin = createAdminClient();
    const { data: authUsers, error } = await admin.auth.admin.listUsers();
    if (error || !authUsers) return [];

    // Fetch roles via admin client too so we stay inside the same cached scope.
    const { data: roles } = await admin
      .from("user_roles")
      .select("user_id, role");

    const roleMap = new Map(
      roles?.map((r) => [r.user_id, r.role as UserRole]) ?? [],
    );

    return authUsers.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name:
        (u.user_metadata?.full_name as string) ||
        (u.user_metadata?.name as string) ||
        u.email?.split("@")[0] ||
        "",
      role: roleMap.get(u.id) ?? null,
      created_at: u.created_at,
    }));
  },
  ["managed-users"],
  { revalidate: 30, tags: ["managed-users"] },
);

/**
 * Returns all users who have ever signed in, with their assigned role.
 * Owner only. Uses admin client to read auth.users.
 */
export async function getUsers(): Promise<ManagedUser[]> {
  const current = await getCurrentUser();
  if (!current || !isOwner(current.role)) return [];

  return _getCachedUsers();
}

/**
 * Sets or updates the role for a user. Pass null to remove access.
 * Owner only.
 */
export async function setUserRole(
  userId: string,
  role: UserRole | null,
): Promise<{ error?: string }> {
  const current = await getCurrentUser();
  if (!current || !isOwner(current.role)) {
    return { error: "Unauthorized" };
  }
  if (userId === current.id) {
    return { error: "You cannot change your own role" };
  }

  const supabase = await createClient();

  if (role === null) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
  } else {
    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });
  }

  revalidateTag(`user-${userId}`, { expire: 0 });
  revalidateTag("managed-users", { expire: 0 });
  revalidatePath("/settings");
  return {};
}
