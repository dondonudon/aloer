"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { en } from "./en";
import type { Locale, Translations } from "./translations";

// ---------------------------------------------------------------------------
// Two separate contexts:
//   I18nValueContext — { locale, t } — re-renders all consumers on locale change
//   I18nSetterContext — { setLocale } — stable reference, never re-renders consumers
// Components that only need to trigger a locale switch (e.g. the language
// toggle button in the sidebar) should consume I18nSetterContext so they are
// not re-rendered on every locale change.
// ---------------------------------------------------------------------------

interface I18nValueContextValue {
  locale: Locale;
  t: Translations;
}

interface I18nSetterContextValue {
  setLocale: (locale: Locale) => void;
}

const I18nValueContext = createContext<I18nValueContextValue>({
  locale: "en",
  t: en,
});

const I18nSetterContext = createContext<I18nSetterContextValue>({
  setLocale: () => {},
});

// ---------------------------------------------------------------------------
// External mutable state — mirrors the pattern used in theme-provider.tsx so
// locale changes propagate to all subscribers without needing React state.
// ---------------------------------------------------------------------------

let currentLocale: Locale = "en";
// Dict cache — `en` is always present (static import); `id` is loaded on demand
// so that English users never download the Indonesian dictionary.
const dictCache: Partial<Record<Locale, Translations>> = { en };

/** Lazily loads a locale's dictionary and fires a re-render when ready. */
async function loadDict(locale: Locale): Promise<Translations> {
  if (dictCache[locale]) return dictCache[locale] as Translations;
  if (locale === "id") {
    const mod = await import("./id");
    dictCache.id = mod.id;
    return mod.id;
  }
  return en;
}

function subscribe(callback: () => void) {
  window.addEventListener("pos-locale-change", callback);
  return () => window.removeEventListener("pos-locale-change", callback);
}

function getSnapshot(): Locale {
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return "en";
}

// Initialise from localStorage before first render. If the stored locale needs
// a dictionary that isn't loaded yet, start fetching it immediately so the
// flash duration is minimised.
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("pos-locale");
  if (stored === "en" || stored === "id") {
    currentLocale = stored;
    if (stored !== "en") {
      // Fire-and-forget: load dict in background; re-render once ready.
      loadDict(stored).then(() => {
        window.dispatchEvent(new Event("pos-locale-change"));
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface I18nProviderProps {
  children: React.ReactNode;
  /**
   * Locale stored in the database for the current user (from DB).
   * When provided it takes precedence over localStorage on first mount.
   */
  initialLocale?: Locale | null;
  /**
   * Optional callback invoked after each locale change so callers can persist
   * the new value (e.g. via a server action).
   */
  onSave?: (locale: Locale) => void;
}

/**
 * Provides i18n locale state and translation dictionary for all child
 * components via `useI18n()`.
 *
 * Internally uses two separate contexts:
 * - `I18nValueContext` for `{ locale, t }` — triggers re-renders on locale change
 * - `I18nSetterContext` for `{ setLocale }` — stable, never triggers re-renders
 */
export function I18nProvider({
  children,
  initialLocale,
  onSave,
}: I18nProviderProps) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Apply the DB value once on first mount — same one-shot pattern as in
  // theme-provider.tsx — to avoid overwriting a change the user made
  // mid-session.
  const initialLocaleRef = useRef(initialLocale);

  useEffect(() => {
    const dbLocale = initialLocaleRef.current;
    if (!dbLocale || currentLocale === dbLocale) return;
    // Ensure the dict is loaded before switching so there's no flash.
    loadDict(dbLocale).then(() => {
      currentLocale = dbLocale;
      localStorage.setItem("pos-locale", dbLocale);
      window.dispatchEvent(new Event("pos-locale-change"));
    });
  }, []);

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // Stable setter — never changes identity, so I18nSetterContext consumers
  // are never re-rendered due to locale changes.
  const setLocale = useCallback((next: Locale) => {
    if (next === currentLocale) return;
    // Load the dict first, then commit the switch atomically.
    loadDict(next).then(() => {
      currentLocale = next;
      localStorage.setItem("pos-locale", next);
      window.dispatchEvent(new Event("pos-locale-change"));
      onSaveRef.current?.(next);
    });
  }, []);

  return (
    <I18nSetterContext.Provider value={{ setLocale }}>
      <I18nValueContext.Provider value={{ locale, t: dictCache[locale] ?? en }}>
        {children}
      </I18nValueContext.Provider>
    </I18nSetterContext.Provider>
  );
}

/**
 * Returns `{ locale, t, setLocale }` for the current locale.
 * `t` is the full typed translation dictionary — use as `t.nav.dashboard`,
 * `t.sales.title`, etc.
 *
 * Components that only need `setLocale` (e.g. a language toggle) should use
 * `useSetLocale()` to avoid re-rendering on every locale change.
 */
export function useI18n() {
  const { locale, t } = useContext(I18nValueContext);
  const { setLocale } = useContext(I18nSetterContext);
  return { locale, t, setLocale };
}

/**
 * Returns only `setLocale`. Components consuming this hook are never
 * re-rendered when the active locale changes.
 */
export function useSetLocale() {
  return useContext(I18nSetterContext).setLocale;
}
