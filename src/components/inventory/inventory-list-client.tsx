"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
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
}

/**
 * Inventory list with search filtering.
 */
export function InventoryListClient({ stock }: InventoryListClientProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return stock;
    const q = search.toLowerCase();
    return stock.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q),
    );
  }, [stock, search]);

  const totalItems = filtered.reduce((sum, s) => sum + s.stock_on_hand, 0);
  const totalValue = filtered.reduce((sum, s) => sum + s.stock_value, 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <Input
          placeholder={t.inventory.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label={t.inventory.searchPlaceholder}
        />
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
    </div>
  );
}
