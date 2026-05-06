"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";

interface FilterBarProps {
  children: ReactNode;
  /** When provided, a Clear button is rendered. Pass `undefined` to hide it. */
  onClear?: () => void;
  className?: string;
}

/**
 * Layout container for composable filter fields.
 *
 * Compose any combination of `<SearchFilter>`, `<SelectFilter>`,
 * `<RangeFilter>`, `<DateRangeFilter>`, `<ActiveFilter>`, etc. as children.
 * Pass `onClear` to enable the Clear button — the parent decides when filters
 * are "active" so it can reset whatever URL/state shape it owns.
 */
export function FilterBar({
  children,
  onClear,
  className = "",
}: FilterBarProps) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-wrap gap-3 items-end ${className}`.trim()}>
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-blue-600 hover:text-blue-700 self-end pb-2"
        >
          {t.filter.clear}
        </button>
      )}
    </div>
  );
}
