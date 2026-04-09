"use client";

import { useCallback, useState } from "react";

export interface ToastState {
  message: string;
  type: "success" | "error";
}

/**
 * Shared toast state hook.
 *
 * Eliminates the repetitive `useState<ToastState | null>(null)` pattern that
 * appeared in every client component. Components that use `<Toast>` should
 * call `useToast()` instead of managing the state manually.
 *
 * @example
 * const { toast, showToast, clearToast } = useToast();
 * // later:
 * showToast("Saved", "success");
 * // in JSX:
 * {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
