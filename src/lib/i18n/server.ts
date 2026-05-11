import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { en } from "./en";
import type { Locale, Translations } from "./translations";

/** Returns the translation dictionary for a given locale. */
async function getLocaleDict(locale: Locale): Promise<Translations> {
  if (locale === "en") return en;
  const { id } = await import("./id");
  return id;
}

/**
 * Server-side helper that returns the translation dictionary for the current
 * user's locale preference.  Uses React's `cache()` so the DB lookup is
 * de-duplicated across all Server Components in the same render tree.
 */
export const getServerTranslations = cache(async (): Promise<Translations> => {
  const user = await getCurrentUser();
  return getLocaleDict(user?.locale ?? "en");
});

/**
 * Returns the translation dictionary for an arbitrary locale code.
 * Used in contexts that aren't bound to the current request user — e.g. cron
 * jobs that send a push notification to each owner in their own language.
 * Falls back to English when the input is null/unknown.
 */
export async function getTranslationsForLocale(
  locale: string | null | undefined,
): Promise<Translations> {
  if (locale === "id" || locale === "en") {
    return getLocaleDict(locale as Locale);
  }
  return en;
}
