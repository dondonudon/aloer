"use client";

import { SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";

export interface StatusOption {
  value: string;
  label: string;
}

export interface FilterChip {
  label: string;
  onRemove: () => void;
}

/** Shared class for every filter `<select>` so they all look identical. */
export const filterSelectCls =
  "h-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 text-sm";

interface ListFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  statusOptions: StatusOption[];
  idPrefix: string;
  /** Extra filter controls rendered inside the collapsible panel. */
  extraFilters?: ReactNode;
  /** Active-filter count for extra filters (adds to the badge). */
  externalActiveCount?: number;
  /** Extra filter chips supplied by the parent (payment type, supplier, etc.). */
  extraChips?: FilterChip[];
  /** Override the clear behaviour when extra state also needs resetting. */
  onClearAll?: () => void;
}

/** Reusable pill shown below the search bar for each active filter. */
function Chip({ label, onRemove }: FilterChip) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/**
 * Filter bar: full-width search + collapsible Filters panel + active-filter chips.
 *
 * - Badge on the Filters button shows how many filters are active.
 * - Chips appear below the search row for every active filter; each is individually dismissible.
 * - Extra filter controls (payment type, supplier, …) go in `extraFilters`.
 * - Extra chips (for those controls) go in `extraChips`.
 */
export function ListFilter({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  idPrefix,
  extraFilters,
  externalActiveCount = 0,
  extraChips,
  onClearAll,
}: ListFilterProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const activeCount =
    (startDate || endDate ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    externalActiveCount;

  // Build chip list from known internal filters + external chips
  const chips: FilterChip[] = [];
  if (startDate)
    chips.push({
      label: `${t.filter.from}: ${startDate}`,
      onRemove: () => onStartDateChange(""),
    });
  if (endDate)
    chips.push({
      label: `${t.filter.to}: ${endDate}`,
      onRemove: () => onEndDateChange(""),
    });
  if (statusFilter) {
    const label =
      statusOptions.find((o) => o.value === statusFilter)?.label ??
      statusFilter;
    chips.push({ label, onRemove: () => onStatusFilterChange("") });
  }
  if (extraChips) chips.push(...extraChips);

  function handleClear() {
    if (onClearAll) {
      onClearAll();
    } else {
      onStartDateChange("");
      onEndDateChange("");
      onStatusFilterChange("");
    }
  }

  return (
    <div className="space-y-2">
      {/* Row 1 — search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label={searchPlaceholder}
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            open || activeCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          }`}
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t.filter.filters}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Chip key={chip.label} {...chip} />
          ))}
        </div>
      )}

      {/* Collapsible filter panel */}
      {open && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor={`${idPrefix}-start`}
                className="text-xs font-medium text-gray-500 dark:text-gray-300 whitespace-nowrap"
              >
                {t.filter.from}
              </label>
              <Input
                id={`${idPrefix}-start`}
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-36 h-9"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label
                htmlFor={`${idPrefix}-end`}
                className="text-xs font-medium text-gray-500 dark:text-gray-300 whitespace-nowrap"
              >
                {t.filter.to}
              </label>
              <Input
                id={`${idPrefix}-end`}
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-36 h-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className={filterSelectCls}
              aria-label={t.filter.filterByStatus}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {extraFilters}

            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-auto"
              >
                {t.filter.clear}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
