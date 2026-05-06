"use client";

import { useI18n } from "@/lib/i18n/context";
import { SelectFilter } from "./select-filter";

interface ActiveFilterProps {
  /** "" = all, "true" = active only, "false" = inactive only */
  value: string;
  onChange: (value: string) => void;
  /** Override the "All" label — defaults to t.filter.allStatus */
  allLabel?: string;
}

/**
 * Active/inactive filter — used by every "is_active"-bearing table.
 *
 * Stores its value as a string ("" | "true" | "false") so it serializes cleanly
 * to URL params. Convert to a boolean on the server side: `value === "true"`.
 */
export function ActiveFilter({ value, onChange, allLabel }: ActiveFilterProps) {
  const { t } = useI18n();
  return (
    <SelectFilter
      label={t.common.status}
      srOnlyLabel
      value={value}
      onChange={onChange}
      options={[
        { value: "", label: allLabel ?? t.filter.allStatus },
        { value: "true", label: t.common.active },
        { value: "false", label: t.common.inactive },
      ]}
    />
  );
}
