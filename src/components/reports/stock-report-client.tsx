"use client";

import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
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

      {(() => {
        const columns: DataTableColumn<StockRow>[] = [
          {
            id: "sku",
            header: "SKU",
            cellClassName: "font-mono text-gray-700 dark:text-gray-300",
            cell: (item) => item.sku,
          },
          {
            id: "name",
            header: t.reports.product,
            cellClassName: "text-gray-900 dark:text-gray-100 font-medium",
            cell: (item) => item.name,
          },
        ];
        if (categories.length > 0) {
          columns.push({
            id: "category",
            header: t.reports.category,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (item) => item.category ?? "—",
          });
        }
        columns.push(
          {
            id: "stockOnHand",
            header: t.reports.stockOnHand,
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
            header: t.reports.stockValue,
            align: "right",
            cellClassName: "text-gray-900 dark:text-gray-100",
            cell: (item) => formatCurrency(item.stock_value),
          },
        );
        return (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(item) => item.sku}
            emptyMessage={t.reports.noStockData}
          />
        );
      })()}
    </div>
  );
}
