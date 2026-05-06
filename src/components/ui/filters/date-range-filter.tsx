"use client";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";

interface DateRangeFilterProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  /** Unique prefix for label htmlFor bindings */
  idPrefix: string;
}

/**
 * Two-input start/end date filter — same shape as the legacy ListFilter
 * dates, exposed as a standalone composable filter field.
 */
export function DateRangeFilter({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  idPrefix,
}: DateRangeFilterProps) {
  const { t } = useI18n();
  return (
    <>
      <div>
        <label
          htmlFor={`${idPrefix}-start`}
          className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1"
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
          className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1"
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
    </>
  );
}
