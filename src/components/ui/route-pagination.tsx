"use client";

import { Pagination } from "@/components/ui/pagination";

interface RoutePaginationProps {
  pathname: string;
  page: number;
  totalPages: number;
  pageSize?: number;
  pageParam?: string;
  limitParam?: string;
  extraParams?: Record<string, string | undefined>;
}

export function RoutePagination({
  pathname,
  page,
  totalPages,
  pageSize,
  pageParam = "page",
  limitParam = "limit",
  extraParams,
}: RoutePaginationProps) {
  function buildHref(nextPage: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) query.set(key, value);
    }
    if (pageSize !== undefined && pageSize !== 10) {
      query.set(limitParam, String(pageSize));
    }
    if (nextPage > 1) query.set(pageParam, String(nextPage));
    const qs = query.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function buildLimitHref(nextLimit: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) query.set(key, value);
    }
    if (nextLimit !== 10) query.set(limitParam, String(nextLimit));
    const qs = query.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      buildHref={buildHref}
      pageSize={pageSize}
      buildLimitHref={buildLimitHref}
    />
  );
}
