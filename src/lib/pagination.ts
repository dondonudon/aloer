export const VALID_PAGE_SIZES = [10, 20, 50, 100] as const;

export type PageSize = (typeof VALID_PAGE_SIZES)[number];

export function parsePage(value: string | undefined): number {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function parsePageSize(
  value: string | undefined,
  defaultValue: PageSize = 10,
): PageSize {
  const limit = Number(value ?? defaultValue);
  return VALID_PAGE_SIZES.includes(limit as PageSize)
    ? (limit as PageSize)
    : defaultValue;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
  };
}
