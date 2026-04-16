import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser, isOwner } from "@/lib/auth";
import { getServerTranslations } from "@/lib/i18n/server";
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
 * @param handler - Receives the supabase client and the authenticated user's ID.
 */
export async function ownerAction<T = undefined>(
  handler: (
    supabase: SupabaseClient,
    userId: string,
  ) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const user = await getCurrentUser();
  if (!user || !isOwner(user.role)) {
    return { error: "Unauthorized" } as ActionResult<T>;
  }
  const supabase = await createClient();
  return handler(supabase, user.id);
}

/**
 * Writes an audit log entry recording a user action.
 * Failures are silently swallowed — audit errors must never block the primary operation.
 */
export async function insertAuditLog(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  entity: string,
  entityId?: string | null,
  payload?: Record<string, unknown> | null,
): Promise<void> {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId ?? null,
    payload: payload ?? null,
  });
}

/**
 * Maps a Supabase/Postgres error to a translated, user-friendly string.
 * Uses the Postgres error code for reliable discrimination (codes are stable
 * across PG versions; message text is not).  Only call this on database
 * errors — not on application-level validation errors.
 *
 * Postgres class-23 codes handled:
 *   23505 — unique_violation
 *   23503 — foreign_key_violation
 *   23502 — not_null_violation
 *   23514 — check_violation
 */
export async function formatDbError(error: {
  message: string;
  code?: string | null;
}): Promise<string> {
  const t = await getServerTranslations();
  const db = t.dbErrors;

  switch (error.code) {
    case "23505": {
      // unique_violation — narrow down which field
      const msg = error.message;
      if (msg.includes("sku")) return db.duplicateSku;
      if (msg.includes("name")) return db.duplicateName;
      return db.duplicateValue;
    }
    case "23503": // foreign_key_violation
      return db.foreignKeyViolation;
    case "23502": // not_null_violation
      return db.notNullViolation;
    case "23514": // check_violation
      return db.checkViolation;
    default:
      return db.generic;
  }
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
