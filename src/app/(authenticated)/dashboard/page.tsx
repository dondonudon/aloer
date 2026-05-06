import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  getOutstandingCreditPOs,
  getOutstandingCreditSales,
} from "@/lib/actions/credit";
import { getStockReport } from "@/lib/actions/inventory";
import { getSalesSummary, getTodaySales } from "@/lib/actions/reports";
import { getCurrentUser } from "@/lib/auth";
import { rollUpDueBreakdown } from "@/lib/credit-due";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatCurrency } from "@/lib/utils";

type Translations = Awaited<ReturnType<typeof getServerTranslations>>;
type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-10 w-28 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 animate-pulse sm:grid-cols-2 lg:grid-cols-4">
      {(["a", "b", "c", "d"] as const).map((key) => (
        <div
          key={key}
          className="h-20 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-2 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-5 dark:border-gray-700">
        <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="space-y-3 p-4">
        {(["r1", "r2", "r3", "r4", "r5", "r6", "r7"] as const).map((key) => (
          <div key={key} className="h-8 rounded bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}

function CreditSkeleton() {
  return (
    <div className="h-28 animate-pulse rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-700/50 dark:bg-orange-900/20" />
  );
}

async function DashboardHeader({
  translationsPromise,
  userPromise,
}: {
  translationsPromise: Promise<Translations>;
  userPromise: Promise<CurrentUser>;
}) {
  const [t, user] = await Promise.all([translationsPromise, userPromise]);

  return (
    <div className="flex items-center justify-between gap-4">
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
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        {t.dashboard.openPos}
      </Link>
    </div>
  );
}

async function DashboardStats({
  translationsPromise,
  todaySalesPromise,
  stockReportPromise,
}: {
  translationsPromise: Promise<Translations>;
  todaySalesPromise: ReturnType<typeof getTodaySales>;
  stockReportPromise: ReturnType<typeof getStockReport>;
}) {
  const [t, todaySales, stockReport] = await Promise.all([
    translationsPromise,
    todaySalesPromise,
    stockReportPromise,
  ]);

  const totalStock = Array.isArray(stockReport)
    ? stockReport.reduce((sum, s) => sum + s.stock_on_hand, 0)
    : 0;

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${stat.color}`}>
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
  );
}

async function DashboardSalesSummary({
  translationsPromise,
  salesSummaryPromise,
}: {
  translationsPromise: Promise<Translations>;
  salesSummaryPromise: ReturnType<typeof getSalesSummary>;
}) {
  const [t, salesSummary] = await Promise.all([
    translationsPromise,
    salesSummaryPromise,
  ]);

  type SummaryRow = (typeof salesSummary)[number];
  const columns: DataTableColumn<SummaryRow>[] = [
    {
      id: "date",
      header: t.dashboard.date,
      cellClassName: "text-gray-900 dark:text-gray-100",
      cell: (row) => row.sale_date,
    },
    {
      id: "transactions",
      header: t.dashboard.transactions,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (row) => row.total_transactions,
    },
    {
      id: "revenue",
      header: t.dashboard.revenue,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (row) => formatCurrency(row.total_revenue),
    },
    {
      id: "cogs",
      header: t.dashboard.cogs,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (row) => formatCurrency(row.total_cogs),
    },
    {
      id: "grossProfit",
      header: t.dashboard.grossProfit,
      align: "right",
      cellClassName: "font-medium text-green-700 dark:text-green-400",
      cell: (row) => formatCurrency(row.gross_profit),
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-5 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t.dashboard.last7Days}
        </h2>
      </div>
      <DataTable
        columns={columns}
        rows={salesSummary}
        rowKey={(row) => row.sale_date}
        emptyMessage={t.dashboard.noSalesData}
        unstyled
      />
    </div>
  );
}

async function DashboardCreditOverview({
  translationsPromise,
  creditSalesPromise,
  creditPOsPromise,
}: {
  translationsPromise: Promise<Translations>;
  creditSalesPromise: ReturnType<typeof getOutstandingCreditSales>;
  creditPOsPromise: ReturnType<typeof getOutstandingCreditPOs>;
}) {
  const [t, creditSales, creditPOs] = await Promise.all([
    translationsPromise,
    creditSalesPromise,
    creditPOsPromise,
  ]);

  const totalAR = creditSales.reduce((sum, sale) => sum + sale.outstanding, 0);
  const totalAP = creditPOs.reduce(
    (sum, purchaseOrder) => sum + purchaseOrder.outstanding,
    0,
  );
  const ar = rollUpDueBreakdown(creditSales);
  const ap = rollUpDueBreakdown(creditPOs);

  if (totalAR === 0 && totalAP === 0) {
    return null;
  }

  return (
    <Link
      href="/credit"
      className="block rounded-xl border border-orange-200 bg-orange-50 p-5 transition-colors hover:bg-orange-100 dark:border-orange-700/50 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-orange-800 dark:text-orange-300">
          {t.dashboard.outstandingCredit}
        </h2>
        <span className="text-xs text-orange-600 underline dark:text-orange-400">
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
          {ar.pastDueCount + ar.dueSoonCount > 0 ? (
            <div className="mt-1 space-y-0.5 text-xs">
              {ar.pastDueCount > 0 ? (
                <p className="text-red-700 dark:text-red-400">
                  {t.credit.pastDue}: {formatCurrency(ar.pastDueAmount)} (
                  {ar.pastDueCount})
                </p>
              ) : null}
              {ar.dueSoonCount > 0 ? (
                <p className="text-amber-700 dark:text-amber-400">
                  {t.credit.dueSoon}: {formatCurrency(ar.dueSoonAmount)} (
                  {ar.dueSoonCount})
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            {t.dashboard.apSuppliers}
          </p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totalAP)}
          </p>
          {ap.pastDueCount + ap.dueSoonCount > 0 ? (
            <div className="mt-1 space-y-0.5 text-xs">
              {ap.pastDueCount > 0 ? (
                <p className="text-red-700 dark:text-red-400">
                  {t.credit.pastDue}: {formatCurrency(ap.pastDueAmount)} (
                  {ap.pastDueCount})
                </p>
              ) : null}
              {ap.dueSoonCount > 0 ? (
                <p className="text-amber-700 dark:text-amber-400">
                  {t.credit.dueSoon}: {formatCurrency(ap.dueSoonAmount)} (
                  {ap.dueSoonCount})
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

async function DashboardLowStockAlert({
  translationsPromise,
  stockReportPromise,
}: {
  translationsPromise: Promise<Translations>;
  stockReportPromise: ReturnType<typeof getStockReport>;
}) {
  const [t, stockReport] = await Promise.all([
    translationsPromise,
    stockReportPromise,
  ]);

  const lowStockItems = Array.isArray(stockReport)
    ? stockReport
        .filter((item) => item.stock_on_hand <= 5)
        .sort((a, b) => a.stock_on_hand - b.stock_on_hand)
    : [];

  return (
    <LowStockAlert
      items={lowStockItems.slice(0, 5)}
      totalCount={lowStockItems.length}
      remainingLabel={t.dashboard.remaining}
      title={t.dashboard.lowStockAlert}
      viewAllLabel={t.dashboard.viewAllLowStock.replace(
        "{count}",
        String(lowStockItems.length),
      )}
    />
  );
}

export default function DashboardPage() {
  const translationsPromise = getServerTranslations();
  const userPromise = getCurrentUser();
  const todaySalesPromise = getTodaySales();
  const salesSummaryPromise = getSalesSummary(undefined, undefined, 7);
  const stockReportPromise = getStockReport();
  const creditSalesPromise = getOutstandingCreditSales();
  const creditPOsPromise = getOutstandingCreditPOs();

  return (
    <div className="space-y-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader
          translationsPromise={translationsPromise}
          userPromise={userPromise}
        />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats
          translationsPromise={translationsPromise}
          todaySalesPromise={todaySalesPromise}
          stockReportPromise={stockReportPromise}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DashboardSalesSummary
          translationsPromise={translationsPromise}
          salesSummaryPromise={salesSummaryPromise}
        />
      </Suspense>

      <Suspense fallback={<CreditSkeleton />}>
        <DashboardCreditOverview
          translationsPromise={translationsPromise}
          creditSalesPromise={creditSalesPromise}
          creditPOsPromise={creditPOsPromise}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DashboardLowStockAlert
          translationsPromise={translationsPromise}
          stockReportPromise={stockReportPromise}
        />
      </Suspense>
    </div>
  );
}
