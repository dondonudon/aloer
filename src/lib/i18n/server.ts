import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { localeMap, type Translations } from "./translations";

/**
 * Server-side helper that returns the translation dictionary for the current
 * user's locale preference.  Uses React's `cache()` so the DB lookup is
 * de-duplicated across all Server Components in the same render tree.
 */
export const getServerTranslations = cache(async (): Promise<Translations> => {
  const user = await getCurrentUser();
  return localeMap[user?.locale ?? "en"];
});
