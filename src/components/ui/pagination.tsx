"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState, useTransition } from "react";
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
 *
 * In link mode (no `onPageChange`), clicks are intercepted and routed through
 * `useTransition` + `router.push` so React keeps `isPending` true until the
 * server-rendered page is ready. The clicked button shows a spinner and the
 * rest of the nav is dimmed/disabled while the transition is pending —
 * Next.js's `loading.tsx` does not fire on query-param-only navigations, so
 * this is what gives the user feedback that page change is in flight.
 * Modifier-clicks (cmd/ctrl/shift/middle) fall through to native Link
 * behavior so "open in new tab" still works.
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
  const [isPending, startTransition] = useTransition();
  // Tracks which control triggered the in-flight transition. The value can go
  // stale once `isPending` flips back to false, but every consumer below gates
  // on `isPending`, so a stale target is harmless and we don't need to clear
  // it from an effect (which would trigger a cascading render).
  const [pendingTarget, setPendingTarget] = useState<number | "limit" | null>(
    null,
  );

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

  const isModifierClick = (e: MouseEvent) =>
    e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

  const navigateTo = (
    e: MouseEvent<HTMLAnchorElement>,
    href: string,
    targetPage: number,
  ) => {
    if (isModifierClick(e)) return;
    e.preventDefault();
    setPendingTarget(targetPage);
    startTransition(() => {
      router.push(href);
    });
  };

  const renderPageLink = (p: number) => {
    const isActive = p === page;
    const isPendingThis = isPending && pendingTarget === p;
    const className = isActive || isPendingThis ? activeLink : inactiveLink;

    if (useCallbacks) {
      return (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange?.(p)}
          className={className}
          aria-label={`${t.pagination.page} ${p}`}
          aria-current={isActive ? "page" : undefined}
        >
          {p}
        </button>
      );
    }

    return (
      <Link
        key={p}
        href={buildHref(p)}
        onClick={(e) => navigateTo(e, buildHref(p), p)}
        className={className}
        aria-label={`${t.pagination.page} ${p}`}
        aria-current={isActive ? "page" : undefined}
      >
        {isPendingThis ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          p
        )}
      </Link>
    );
  };

  const renderArrow = (direction: "prev" | "next") => {
    const targetPage = direction === "prev" ? page - 1 : page + 1;
    const disabled = direction === "prev" ? page <= 1 : page >= totalPages;
    const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
    const label =
      direction === "prev" ? t.pagination.previousPage : t.pagination.nextPage;
    const labelDisabled =
      direction === "prev"
        ? t.pagination.previousPageDisabled
        : t.pagination.nextPageDisabled;

    if (disabled) {
      return (
        <button
          type="button"
          disabled
          className={disabledLink}
          aria-label={labelDisabled}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      );
    }

    if (useCallbacks) {
      return (
        <button
          type="button"
          onClick={() => onPageChange?.(targetPage)}
          className={inactiveLink}
          aria-label={label}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      );
    }

    const isPendingThis = isPending && pendingTarget === targetPage;
    return (
      <Link
        href={buildHref(targetPage)}
        onClick={(e) => navigateTo(e, buildHref(targetPage), targetPage)}
        className={inactiveLink}
        aria-label={label}
      >
        {isPendingThis ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
      </Link>
    );
  };

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
          <div className="relative flex items-center">
            <select
              id="pagination-rows-per-page"
              value={pageSize}
              disabled={isPending}
              onChange={(e) => {
                const nextLimit = Number(e.target.value);
                if (onPageSizeChange) {
                  onPageSizeChange(nextLimit);
                  return;
                }
                setPendingTarget("limit");
                startTransition(() => {
                  router.push(buildLimitHref(nextLimit));
                });
              }}
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 pl-2 pr-7 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {isPending && pendingTarget === "limit" && (
              <Loader2
                className="ml-2 h-4 w-4 animate-spin text-blue-600"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      )}

      {showPageNav && (
        <nav
          aria-label={t.pagination.label}
          aria-busy={isPending || undefined}
          className={`flex items-center gap-1 ${isPending ? "opacity-70" : ""}`}
        >
          {renderArrow("prev")}
          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`ellipsis-before-${pages[i + 1] ?? "end"}`}
                className="px-1 text-gray-400 select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              renderPageLink(p)
            ),
          )}
          {renderArrow("next")}
        </nav>
      )}
    </div>
  );
}
