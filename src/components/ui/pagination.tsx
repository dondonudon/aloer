"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface PaginationProps {
  /** Current 1-based page number */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Function that returns the href for a given page number */
  buildHref: (page: number) => string;
  /** Optional callback invoked when a page is selected instead of navigating by link */
  onPageChange?: (page: number) => void;
  /** Current page size (enables the rows-per-page dropdown when provided) */
  pageSize?: number;
  /** Function that returns the href for a new limit value; resets to page 1 */
  buildLimitHref?: (limit: number) => string;
  /** Optional callback invoked when the page size changes instead of navigating by link */
  onPageSizeChange?: (limit: number) => void;
}

/**
 * Accessible pagination control rendered as a nav landmark with
 * previous / page numbers / next links.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  onPageChange,
  pageSize,
  buildLimitHref,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useI18n();
  const router = useRouter();

  const showLimitDropdown =
    pageSize !== undefined && buildLimitHref !== undefined;
  const showPageNav = totalPages > 1;
  const useCallbacks = onPageChange !== undefined;

  if (!showLimitDropdown && !showPageNav) return null;

  // Compute the window of page numbers to show (max 5 visible)
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  const pages: (number | "…")[] = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("…");
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("…");
    pages.push(totalPages);
  }

  const linkBase =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors";
  const activeLink = `${linkBase} bg-blue-600 text-white font-medium`;
  const inactiveLink = `${linkBase} text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`;
  const disabledLink = `${linkBase} text-gray-300 dark:text-gray-600 pointer-events-none`;

  return (
    <div
      className={`flex items-center py-4 ${showLimitDropdown && showPageNav ? "justify-between" : "justify-center"}`}
    >
      {showLimitDropdown && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <label
            htmlFor="pagination-rows-per-page"
            className="whitespace-nowrap"
          >
            {t.pagination.rowsPerPage}
          </label>
          <select
            id="pagination-rows-per-page"
            value={pageSize}
            onChange={(e) => {
              const nextLimit = Number(e.target.value);
              if (onPageSizeChange) {
                onPageSizeChange(nextLimit);
                return;
              }
              router.push(buildLimitHref(nextLimit));
            }}
            className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 pl-2 pr-7 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPageNav && (
        <nav
          aria-label={t.pagination.label}
          className="flex items-center gap-1"
        >
          {page > 1 ? (
            useCallbacks ? (
              <button
                type="button"
                onClick={() => onPageChange?.(page - 1)}
                className={inactiveLink}
                aria-label={t.pagination.previousPage}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <Link
                href={buildHref(page - 1)}
                className={inactiveLink}
                aria-label={t.pagination.previousPage}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            )
          ) : (
            <button
              type="button"
              disabled
              className={disabledLink}
              aria-label={t.pagination.previousPageDisabled}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`ellipsis-before-${pages[i + 1] ?? "end"}`}
                className="px-1 text-gray-400 select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : useCallbacks ? (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange?.(p)}
                className={p === page ? activeLink : inactiveLink}
                aria-label={`${t.pagination.page} ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ) : (
              <Link
                key={p}
                href={buildHref(p)}
                className={p === page ? activeLink : inactiveLink}
                aria-label={`${t.pagination.page} ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Link>
            ),
          )}

          {page < totalPages ? (
            useCallbacks ? (
              <button
                type="button"
                onClick={() => onPageChange?.(page + 1)}
                className={inactiveLink}
                aria-label={t.pagination.nextPage}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <Link
                href={buildHref(page + 1)}
                className={inactiveLink}
                aria-label={t.pagination.nextPage}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )
          ) : (
            <button
              type="button"
              disabled
              className={disabledLink}
              aria-label={t.pagination.nextPageDisabled}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
