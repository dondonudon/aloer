"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n/context";
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
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            setPage(1);
          }}
          className={`shrink-0 px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
            lowStockOnly
              ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
              : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {t.inventory.lowStockOnly}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} products · {totalItems} total units ·{" "}
        {formatCurrency(totalValue)} value
      </p>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  SKU
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.inventory.product}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.inventory.stockOnHand}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.inventory.stockValue}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.inventory.batches}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr
                  key={item.sku}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                    {item.sku}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-medium ${
                        item.stock_on_hand <= 5
                          ? "text-red-600"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {item.stock_on_hand}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.stock_value)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.id && (
                      <Link
                        href={`/inventory/${item.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {t.common.view}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    {t.inventory.noInventoryFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
