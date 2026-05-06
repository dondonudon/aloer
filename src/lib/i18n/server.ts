import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { type Locale, localeMap, type Translations } from "./translations";

/**
 * Server-side helper that returns the translation dictionary for the current
 * user's locale preference.  Uses React's `cache()` so the DB lookup is
 * de-duplicated across all Server Components in the same render tree.
 */
export const getServerTranslations = cache(async (): Promise<Translations> => {
  const user = await getCurrentUser();
  return localeMap[user?.locale ?? "en"];
});

/**
 * Returns the translation dictionary for an arbitrary locale code.
 * Used in contexts that aren't bound to the current request user — e.g. cron
 * jobs that send a push notification to each owner in their own language.
 * Falls back to English when the input is null/unknown.
 */
export function getTranslationsForLocale(
  locale: string | null | undefined,
): Translations {
  if (locale === "id" || locale === "en") {
    return localeMap[locale as Locale];
  }
  return localeMap.en;
}
