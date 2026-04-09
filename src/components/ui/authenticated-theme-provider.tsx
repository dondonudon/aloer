"use client";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { saveTheme } from "@/lib/actions/users";

/**
 * Wraps ThemeProvider for authenticated routes.
 * Passes the user's DB-stored theme preference as the initial value and
 * persists any toggle back to the database via the saveTheme server action.
 */
export function AuthenticatedThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: "light" | "dark" | null;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider initialTheme={initialTheme} onSave={saveTheme}>
      {children}
    </ThemeProvider>
  );
}
