"use client";

import { Input } from "@/components/ui/input";

interface RangeFilterProps {
  label: string;
  /** Controlled minimum (string so an empty input = "no min") */
  min: string;
  onMinChange: (value: string) => void;
  /** Controlled maximum (string so an empty input = "no max") */
  max: string;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  /** Native input type. Defaults to "number" — pass "date" for a date range. */
  type?: "number" | "date";
  /** Unique prefix for label htmlFor bindings */
  idPrefix: string;
  /** Width per input (Tailwind class). Defaults to "w-28" for numeric, "w-40" for date. */
  inputClassName?: string;
}

/**
 * Two-input min/max range filter (numeric or date).
 *
 * Empty string = open-ended on that side. Parents should treat empty values as
 * "don't filter on this bound" when serializing to URL params.
 */
export function RangeFilter({
  label,
  min,
  onMinChange,
  max,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
  type = "number",
  idPrefix,
  inputClassName,
}: RangeFilterProps) {
  const widthClass = inputClassName ?? (type === "date" ? "w-40" : "w-28");
  // Suppress native spin buttons on number inputs — keeps the row visually
  // aligned with text inputs and selects in the same FilterBar.
  const spinnerHide =
    type === "number"
      ? "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      : "";
  const inputClass = `${widthClass} ${spinnerHide}`.trim();
  return (
    <div>
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <Input
          id={`${idPrefix}-min`}
          type={type}
          inputMode={type === "number" ? "numeric" : undefined}
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder={minPlaceholder}
          className={inputClass}
          aria-label={`${label} — min`}
        />
        <span className="text-gray-400" aria-hidden="true">
          –
        </span>
        <Input
          id={`${idPrefix}-max`}
          type={type}
          inputMode={type === "number" ? "numeric" : undefined}
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder={maxPlaceholder}
          className={inputClass}
          aria-label={`${label} — max`}
        />
      </div>
    </div>
  );
}
