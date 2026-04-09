"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

let currentTheme: Theme = "light";

function subscribe(callback: () => void) {
  window.addEventListener("pos-theme-change", callback);
  return () => window.removeEventListener("pos-theme-change", callback);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "light";
}

function resolveInitialTheme(override?: Theme | null): Theme {
  if (override) return override;
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("pos-theme");
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

// Set the initial value eagerly so the first getSnapshot call is correct.
// The DB-sourced override is applied once the provider mounts (see useEffect below).
if (typeof window !== "undefined") {
  currentTheme = resolveInitialTheme();
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * Server-resolved theme preference for the current user (from DB).
   * When provided it takes precedence over localStorage / system preference
   * on first mount.
   */
  initialTheme?: Theme | null;
  /**
   * Optional callback invoked after each toggle so callers can persist the
   * new value (e.g. via a server action).
   */
  onSave?: (theme: Theme) => void;
}

/**
 * Provides theme state and toggle for light/dark mode.
 * When `initialTheme` is supplied (authenticated routes) the DB value wins
 * over localStorage. Changes are propagated to both localStorage and the
 * optional `onSave` callback.
 */
export function ThemeProvider({
  children,
  initialTheme,
  onSave,
}: ThemeProviderProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Capture initialTheme in a ref so the mount effect is stable (no deps needed).
  // The DB value should only be applied once — on first mount — to avoid
  // overwriting a toggle the user made mid-session.
  const initialThemeRef = useRef(initialTheme);

  useEffect(() => {
    const dbTheme = initialThemeRef.current;
    if (!dbTheme || currentTheme === dbTheme) return;
    currentTheme = dbTheme;
    localStorage.setItem("pos-theme", dbTheme);
    window.dispatchEvent(new Event("pos-theme-change"));
  }, []);

  // Sync the DOM class with the current theme.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = currentTheme === "light" ? "dark" : "light";
    currentTheme = next;
    localStorage.setItem("pos-theme", next);
    window.dispatchEvent(new Event("pos-theme-change"));
    onSave?.(next);
  }, [onSave]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
