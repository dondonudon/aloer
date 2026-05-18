"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n/context";
import { withFromParam } from "@/lib/navigation";
import { formatCurrency } from "@/lib/utils";

interface StockItem {
  id?: string;
  sku: string;
  name: string;
  stock_on_hand: number;
  stock_value: number;
}

interface InventoryListClientProps {
  stock: StockItem[];
  initialPage: number;
  initialPageSize: number;
  initialSearch: string;
  initialLowStockOnly: boolean;
}

export function InventoryListClient({
  stock,
  initialPage,
  initialPageSize,
  initialSearch,
  initialLowStockOnly,
}: InventoryListClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStockOnly);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (pageSize !== 10) params.set("limit", String(pageSize));
      if (lowStockOnly) params.set("lowStock", "true");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, pageSize, lowStockOnly, router, pathname]);

  const filtered = useMemo(() => {
    let result = stock;
    if (lowStockOnly) result = result.filter((item) => item.stock_on_hand <= 5);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q),
      );
    }
    return result;
  }, [stock, search, lowStockOnly]);

  const totalItems = filtered.reduce((sum, s) => sum + s.stock_on_hand, 0);
  const totalValue = filtered.reduce((sum, s) => sum + s.stock_value, 0);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function buildParams() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (lowStockOnly) params.set("lowStock", "true");
    return params;
  }

  function buildHref(nextPage: number) {
    const params = buildParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function buildLimitHref(nextLimit: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (nextLimit !== 10) params.set("limit", String(nextLimit));
    if (lowStockOnly) params.set("lowStock", "true");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
            <Input
              placeholder={t.inventory.searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
              aria-label={t.inventory.searchPlaceholder}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              filtersOpen || lowStockOnly
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t.filter.filters}
            {lowStockOnly && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold">
                1
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {lowStockOnly && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              {t.inventory.lowStockOnly}
              <button
                type="button"
                onClick={() => {
                  setLowStockOnly(false);
                  setPage(1);
                }}
                className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                aria-label="Remove low stock filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {/* Collapsible filter panel */}
        {filtersOpen && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => {
                    setLowStockOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 accent-amber-500"
                />
                {t.inventory.lowStockOnly}
              </label>
              {lowStockOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setLowStockOnly(false);
                    setPage(1);
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-auto"
                >
                  {t.filter.clear}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} products · {totalItems} total units ·{" "}
        {formatCurrency(totalValue)} value
      </p>

      {(() => {
        const columns: DataTableColumn<StockItem>[] = [
          {
            id: "sku",
            header: "SKU",
            cellClassName: "font-mono text-gray-700 dark:text-gray-300",
            cell: (item) => item.sku,
          },
          {
            id: "name",
            header: t.inventory.product,
            cellClassName: "text-gray-900 dark:text-gray-100 font-medium",
            cell: (item) => item.name,
          },
          {
            id: "stockOnHand",
            header: t.inventory.stockOnHand,
            align: "right",
            cell: (item) => (
              <span
                className={`font-medium ${
                  item.stock_on_hand <= 5
                    ? "text-red-600"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {item.stock_on_hand}
              </span>
            ),
          },
          {
            id: "stockValue",
            header: t.inventory.stockValue,
            align: "right",
            cellClassName: "text-gray-900 dark:text-gray-100",
            cell: (item) => formatCurrency(item.stock_value),
          },
          {
            id: "batches",
            header: t.inventory.batches,
            align: "center",
            cell: (item) =>
              item.id ? (
                <Link
                  href={withFromParam(
                    `/inventory/${item.id}`,
                    buildHref(currentPage),
                  )}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {t.common.view}
                </Link>
              ) : null,
          },
        ];
        return (
          <DataTable
            columns={columns}
            rows={visibleItems}
            rowKey={(item) => item.sku}
            emptyMessage={t.inventory.noInventoryFound}
          />
        );
      })()}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        buildHref={buildHref}
        pageSize={pageSize}
        buildLimitHref={buildLimitHref}
      />
    </div>
  );
}
