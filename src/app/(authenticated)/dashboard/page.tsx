import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import {
  getOutstandingCreditPOs,
  getOutstandingCreditSales,
} from "@/lib/actions/credit";
import { getStockReport } from "@/lib/actions/inventory";
import { getSalesSummary, getTodaySales } from "@/lib/actions/reports";
import { getCurrentUser } from "@/lib/auth";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const userPromise = getCurrentUser();
  const [t, todaySales, salesSummary, stockReport, creditSales, creditPOs] =
    await Promise.all([
      getServerTranslations(),
      getTodaySales(),
      getSalesSummary(undefined, undefined, 7),
      getStockReport(),
      getOutstandingCreditSales(),
      getOutstandingCreditPOs(),
    ]);
  const user = await userPromise;

  const totalAR = creditSales.reduce((sum, s) => sum + s.outstanding, 0);
  const totalAP = creditPOs.reduce((sum, p) => sum + p.outstanding, 0);

  const totalStock = Array.isArray(stockReport)
    ? stockReport.reduce((sum, s) => sum + s.stock_on_hand, 0)
    : 0;
  const lowStockItems = Array.isArray(stockReport)
    ? stockReport.filter((s) => s.stock_on_hand <= 5)
    : [];

  const stats = [
    {
      label: t.dashboard.todaySales,
      value: formatCurrency(todaySales.total_revenue),
      icon: DollarSign,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: t.dashboard.transactionsToday,
      value: todaySales.total_transactions,
      icon: ShoppingCart,
      color: "bg-green-50 text-green-700",
    },
    {
      label: t.dashboard.grossProfitToday,
      value: formatCurrency(todaySales.gross_profit),
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: t.dashboard.totalStockItems,
      value: totalStock,
      icon: Package,
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.dashboard.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.dashboard.welcomeBack} {user?.name}
          </p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.openPos}
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent sales */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t.dashboard.last7Days}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400">
                  {t.dashboard.date}
                </th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 dark:text-gray-400">
                  {t.dashboard.transactions}
                </th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 dark:text-gray-400">
                  {t.dashboard.revenue}
                </th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 dark:text-gray-400">
                  {t.dashboard.cogs}
                </th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 dark:text-gray-400">
                  {t.dashboard.grossProfit}
                </th>
              </tr>
            </thead>
            <tbody>
              {salesSummary.map((row) => (
                <tr
                  key={row.sale_date}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-5 text-gray-900 dark:text-gray-100">
                    {row.sale_date}
                  </td>
                  <td className="py-3 px-5 text-right text-gray-700 dark:text-gray-300">
                    {row.total_transactions}
                  </td>
                  <td className="py-3 px-5 text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(row.total_revenue)}
                  </td>
                  <td className="py-3 px-5 text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(row.total_cogs)}
                  </td>
                  <td className="py-3 px-5 text-right font-medium text-green-700 dark:text-green-400">
                    {formatCurrency(row.gross_profit)}
                  </td>
                </tr>
              ))}
              {salesSummary.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    {t.dashboard.noSalesData}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit overview widget */}
      {(totalAR > 0 || totalAP > 0) && (
        <Link
          href="/credit"
          className="block rounded-xl border border-orange-200 dark:border-orange-700/50 bg-orange-50 dark:bg-orange-900/20 p-5 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-orange-800 dark:text-orange-300">
              {t.dashboard.outstandingCredit}
            </h2>
            <span className="text-xs text-orange-600 dark:text-orange-400 underline">
              {t.dashboard.viewAll}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {t.dashboard.arCustomers}
              </p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {formatCurrency(totalAR)}
              </p>
            </div>
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {t.dashboard.apSuppliers}
              </p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totalAP)}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Low stock alert */}
      <LowStockAlert
        items={lowStockItems}
        remainingLabel={t.dashboard.remaining}
        title={t.dashboard.lowStockAlert}
      />
    </div>
  );
}
