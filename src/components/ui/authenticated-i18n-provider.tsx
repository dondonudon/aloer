"use client";

import { saveLocale } from "@/lib/actions/users";
import { I18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

/**
 * Wraps I18nProvider for authenticated routes.
 * Passes the user's DB-stored locale preference as the initial value and
 * persists any changes back to the database via the saveLocale server action.
 */
export function AuthenticatedI18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale | null;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider initialLocale={initialLocale} onSave={saveLocale}>
      {children}
    </I18nProvider>
  );
}
