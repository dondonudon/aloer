"use server";

import { revalidatePath } from "next/cache";
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
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  created_at: string;
}

/**
 * Returns all users who have ever signed in, with their assigned role.
 * Owner only. Uses admin client to read auth.users.
 */
export async function getUsers(): Promise<ManagedUser[]> {
  const current = await getCurrentUser();
  if (!current || !isOwner(current.role)) return [];

  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: authUsers, error } = await admin.auth.admin.listUsers();
  if (error || !authUsers) return [];

  const { data: roles } = await supabase
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

  revalidatePath("/settings");
  return {};
}
