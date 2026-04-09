"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  /** Current 1-based page number */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Function that returns the href for a given page number */
  buildHref: (page: number) => string;
}

/**
 * Accessible pagination control rendered as a nav landmark with
 * previous / page numbers / next links.
 */
export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

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
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 py-4"
    >
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className={inactiveLink}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className={disabledLink}
          aria-label="Previous page (disabled)"
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
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={p === page ? activeLink : inactiveLink}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className={inactiveLink}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className={disabledLink}
          aria-label="Next page (disabled)"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}
