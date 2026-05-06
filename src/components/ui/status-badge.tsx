"use client";

import { useI18n } from "@/lib/i18n/context";

interface StatusBadgeProps {
  active: boolean;
  /** Override the "Active" label (defaults to t.common.active) */
  activeLabel?: string;
  /** Override the "Inactive" label (defaults to t.common.inactive) */
  inactiveLabel?: string;
}

/**
 * Active/inactive pill — the canonical badge for any `is_active` column.
 * Use this so every table renders the same way and stays consistent if the
 * styling ever changes.
 */
export function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: StatusBadgeProps) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {active
        ? (activeLabel ?? t.common.active)
        : (inactiveLabel ?? t.common.inactive)}
    </span>
  );
}
