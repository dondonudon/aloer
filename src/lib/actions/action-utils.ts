import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser, isOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Canonical result shape for all mutating server actions. */
export type ActionResult<T = undefined> =
  | { error: string; data?: never }
  | (T extends undefined ? { error?: never } : { error?: never; data: T });

/**
 * Runs a mutating server action as the authenticated owner.
 * Handles auth/role check and Supabase client creation so individual
 * actions only contain business logic.
 *
 * @param handler - Receives the supabase client and returns an ActionResult.
 */
export async function ownerAction<T = undefined>(
  handler: (supabase: SupabaseClient) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const user = await getCurrentUser();
  if (!user || !isOwner(user.role)) {
    return { error: "Unauthorized" } as ActionResult<T>;
  }
  const supabase = await createClient();
  return handler(supabase);
}

/**
 * Shared name field validator.
 * Returns an error string if invalid, or null if valid.
 */
export function validateName(
  raw: FormDataEntryValue | null,
  label: string,
  maxLength = 200,
): string | null {
  const trimmed = (raw as string)?.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > maxLength)
    return `${label} must be ${maxLength} characters or less`;
  return null;
}
