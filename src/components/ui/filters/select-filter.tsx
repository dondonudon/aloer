"use client";

export interface SelectFilterOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  /** Visible label (rendered above the select). Hidden visually if `srOnlyLabel`. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFilterOption[];
  /** Hide label visually but keep it for screen readers. */
  srOnlyLabel?: boolean;
  /** Optional id for label htmlFor binding (auto-generated if omitted). */
  id?: string;
  /** Optional fixed width — defaults to auto */
  className?: string;
}

let autoIdCounter = 0;

export function SelectFilter({
  label,
  value,
  onChange,
  options,
  srOnlyLabel = false,
  id,
  className = "",
}: SelectFilterProps) {
  const fieldId = id ?? `filter-select-${++autoIdCounter}`;
  return (
    <div>
      <label
        htmlFor={fieldId}
        className={
          srOnlyLabel
            ? "sr-only"
            : "block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1"
        }
      >
        {label}
      </label>
      <select
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-[38px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 text-sm ${className}`.trim()}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
