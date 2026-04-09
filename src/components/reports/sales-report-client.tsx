"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { exportPdf } from "@/lib/export";
import { useI18n } from "@/lib/i18n/context";
import type { SalesSummaryRow } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SalesReportClientProps {
  summary: SalesSummaryRow[];
}

/**
 * Sales summary report with date range filtering.
 */
export function SalesReportClient({ summary }: SalesReportClientProps) {
  const { t } = useI18n();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    return summary.filter((row) => {
      if (startDate && row.sale_date < startDate) return false;
      if (endDate && row.sale_date > endDate) return false;
      return true;
    });
  }, [summary, startDate, endDate]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, row) => ({
        transactions: acc.transactions + row.total_transactions,
        revenue: acc.revenue + row.total_revenue,
        cogs: acc.cogs + row.total_cogs,
        profit: acc.profit + row.gross_profit,
      }),
      { transactions: 0, revenue: 0, cogs: 0, profit: 0 },
    );
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label
            htmlFor="sales-start"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            {t.reports.from}
          </label>
          <Input
            id="sales-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label
            htmlFor="sales-end"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            {t.reports.to}
          </label>
          <Input
            id="sales-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {t.reports.clear}
          </button>
        )}
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={() =>
              exportPdf(
                "Sales Summary Report",
                [
                  { header: "Date", key: "Date" },
                  {
                    header: "Transactions",
                    key: "Transactions",
                    align: "right",
                  },
                  { header: "Revenue", key: "Revenue", align: "right" },
                  { header: "COGS", key: "COGS", align: "right" },
                  {
                    header: "Gross Profit",
                    key: "Gross Profit",
                    align: "right",
                  },
                  { header: "Margin %", key: "Margin", align: "right" },
                ],
                filtered.map((r) => ({
                  Date: r.sale_date,
                  Transactions: r.total_transactions,
                  Revenue: formatCurrency(r.total_revenue),
                  COGS: formatCurrency(r.total_cogs),
                  "Gross Profit": formatCurrency(r.gross_profit),
                  Margin:
                    r.total_revenue > 0
                      ? `${((r.gross_profit / r.total_revenue) * 100).toFixed(1)}%`
                      : "0.0%",
                })),
                "sales-report",
              )
            }
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                  {t.reports.date}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.reports.transactions}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.reports.revenue}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.reports.cogs}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.reports.grossProfit}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.reports.margin}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const margin =
                  row.total_revenue > 0
                    ? ((row.gross_profit / row.total_revenue) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr
                    key={row.sale_date}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                      {row.sale_date}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {row.total_transactions}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(row.total_revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(row.total_cogs)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-green-700 dark:text-green-400">
                      {formatCurrency(row.gross_profit)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {margin}%
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    {t.reports.noSalesData}
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-medium">
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {t.reports.total}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                    {totals.transactions}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(totals.revenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(totals.cogs)}
                  </td>
                  <td className="py-3 px-4 text-right text-green-700 dark:text-green-400">
                    {formatCurrency(totals.profit)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {totals.revenue > 0
                      ? ((totals.profit / totals.revenue) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
