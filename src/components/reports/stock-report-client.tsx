"use client";

import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { exportPdf } from "@/lib/export";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/utils";

interface StockRow {
  id?: string;
  sku: string;
  name: string;
  category?: string | null;
  stock_on_hand: number;
  stock_value: number;
}

interface StockReportClientProps {
  stock: StockRow[];
  categories: string[];
}

/**
 * Stock report with search and category filtering.
 */
export function StockReportClient({
  stock,
  categories,
}: StockReportClientProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    return stock.filter((item) => {
      if (category && item.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.name.toLowerCase().includes(q) &&
          !item.sku.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [stock, search, category]);

  const totalQty = filtered.reduce((s, i) => s + i.stock_on_hand, 0);
  const totalValue = filtered.reduce((s, i) => s + i.stock_value, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search stock"
          />
        </div>
        {categories.length > 0 && (
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              aria-label={t.reports.filterByCategory}
            >
              <option value="">{t.reports.allCategories}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length} products · {totalQty} total units ·{" "}
          {formatCurrency(totalValue)} total value
        </p>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={() =>
              exportPdf(
                "Stock Report",
                [
                  { header: "SKU", key: "SKU" },
                  { header: "Product", key: "Product" },
                  { header: "Category", key: "Category" },
                  {
                    header: "Stock on Hand",
                    key: "Stock on Hand",
                    align: "right",
                  },
                  { header: "Stock Value", key: "Stock Value", align: "right" },
                ],
                filtered.map((item) => ({
                  SKU: item.sku,
                  Product: item.name,
                  Category: item.category ?? "—",
                  "Stock on Hand": item.stock_on_hand,
                  "Stock Value": formatCurrency(item.stock_value),
                })),
                "stock-report",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.reports.exportPdf}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.reports.exportPdf}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  SKU
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.reports.product}
                </th>
                {categories.length > 0 && (
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    {t.reports.category}
                  </th>
                )}
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.reports.stockOnHand}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.reports.stockValue}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
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
                  {categories.length > 0 && (
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {item.category ?? "—"}
                    </td>
                  )}
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={categories.length > 0 ? 5 : 4}
                    className="py-8 text-center text-gray-400"
                  >
                    {t.reports.noStockData}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
