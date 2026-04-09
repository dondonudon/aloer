"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";

export interface StatusOption {
  value: string;
  label: string;
}

interface ListFilterProps {
  /** Controlled search text */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Controlled start date (YYYY-MM-DD) */
  startDate: string;
  onStartDateChange: (value: string) => void;
  /** Controlled end date (YYYY-MM-DD) */
  endDate: string;
  onEndDateChange: (value: string) => void;
  /** Controlled status filter value */
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  /** Options for the status dropdown. First item should be the "all" option. */
  statusOptions: StatusOption[];
  /**
   * Unique ID prefix for `<label htmlFor>` bindings to avoid collisions when
   * multiple filter bars exist on the same page.
   */
  idPrefix: string;
}

/**
 * Generic date-range + search + status filter bar.
 *
 * Shared by SalesListClient, PurchasesListClient, and any future list page.
 * All state is controlled by the parent — this component is purely presentational.
 *
 * Accessibility: all inputs have explicit labels; the Clear button is visible
 * only when at least one filter is active.
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
}: ListFilterProps) {
  const { t } = useI18n();
  const hasFilters = search || startDate || endDate || statusFilter;

  function clearAll() {
    onSearchChange("");
    onStartDateChange("");
    onEndDateChange("");
    onStatusFilterChange("");
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="relative flex-1 min-w-[200px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          aria-label={searchPlaceholder}
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-start`}
          className="block text-xs font-medium text-gray-500 mb-1"
        >
          {t.filter.from}
        </label>
        <Input
          id={`${idPrefix}-start`}
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-40"
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-end`}
          className="block text-xs font-medium text-gray-500 mb-1"
        >
          {t.filter.to}
        </label>
        <Input
          id={`${idPrefix}-end`}
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-40"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
        aria-label={t.filter.filterByStatus}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {t.filter.clear}
        </button>
      )}
    </div>
  );
}
