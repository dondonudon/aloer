// Catches any uncaught errors in authenticated routes and shows a friendly
// recovery UI instead of a blank screen.
"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for all authenticated pages.
 *
 * - Logs the error to the console for easier debugging.
 * - Provides a `Try again` button that retries the failed segment.
 *
 * @accessibility
 * The error icon is decorative (`aria-hidden`); the heading conveys the
 * message to screen readers.
 */
export default function AuthenticatedError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 py-24 text-center"
    >
      <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
