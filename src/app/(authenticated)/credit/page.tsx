import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { RoutePagination } from "@/components/ui/route-pagination";
import {
  getOutstandingCreditPOs,
  getOutstandingCreditSales,
} from "@/lib/actions/credit";
import { getServerTranslations } from "@/lib/i18n/server";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CreditPage({ searchParams }: Props) {
  const params = await searchParams;
  const arPage = parsePage(params.arPage);
  const apPage = parsePage(params.apPage);
  const arPageSize = parsePageSize(params.arLimit);
  const apPageSize = parsePageSize(params.apLimit);

  const [creditSales, creditPOs, t] = await Promise.all([
    getOutstandingCreditSales(),
    getOutstandingCreditPOs(),
    getServerTranslations(),
  ]);

  const { items: arItems, totalPages: arTotalPages } = paginate(
    creditSales,
    arPage,
    arPageSize,
  );
  const { items: apItems, totalPages: apTotalPages } = paginate(
    creditPOs,
    apPage,
    apPageSize,
  );

  const totalAR = creditSales.reduce((sum, s) => sum + s.outstanding, 0);
  const totalAP = creditPOs.reduce((sum, p) => sum + p.outstanding, 0);

  type ARRow = (typeof creditSales)[number];
  type APRow = (typeof creditPOs)[number];

  const arColumns: DataTableColumn<ARRow>[] = [
    {
      id: "invoice",
      header: t.credit.invoice,
      cellClassName: "font-mono text-xs text-gray-700 dark:text-gray-300",
      cell: (s) => s.invoice_number,
    },
    {
      id: "reseller",
      header: t.credit.reseller,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (s) => (s.resellers as { name: string }[] | null)?.[0]?.name || "—",
    },
    {
      id: "date",
      header: t.credit.date,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (s) => formatDateTime(s.created_at),
    },
    {
      id: "total",
      header: t.credit.total,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (s) => formatCurrency(s.total_amount),
    },
    {
      id: "collected",
      header: t.credit.collected,
      align: "right",
      cellClassName: "text-green-600 dark:text-green-400",
      cell: (s) => formatCurrency(s.collected),
    },
    {
      id: "outstanding",
      header: t.credit.outstanding,
      align: "right",
      cellClassName: "font-semibold",
      cell: (s) => (
        <span
          className={
            s.outstanding > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-green-600 dark:text-green-400"
          }
        >
          {formatCurrency(s.outstanding)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (s) => (
        <Link
          href={`/sales/${s.id}`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t.credit.view}
        </Link>
      ),
    },
  ];

  const apColumns: DataTableColumn<APRow>[] = [
    {
      id: "po",
      header: t.credit.poNumber,
      cellClassName: "font-mono text-xs text-gray-700 dark:text-gray-300",
      cell: (po) => po.po_number,
    },
    {
      id: "supplier",
      header: t.credit.supplier,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (po) =>
        (po.suppliers as { name: string }[] | null)?.[0]?.name || "—",
    },
    {
      id: "date",
      header: t.credit.date,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (po) => formatDateTime(po.created_at),
    },
    {
      id: "total",
      header: t.credit.total,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (po) => formatCurrency(po.total_amount),
    },
    {
      id: "paid",
      header: t.credit.paid,
      align: "right",
      cellClassName: "text-green-600 dark:text-green-400",
      cell: (po) => formatCurrency(po.paid),
    },
    {
      id: "outstanding",
      header: t.credit.outstanding,
      align: "right",
      cellClassName: "font-semibold",
      cell: (po) => (
        <span
          className={
            po.outstanding > 0
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400"
          }
        >
          {formatCurrency(po.outstanding)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (po) => (
        <Link
          href={`/purchases/${po.id}`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t.credit.view}
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.credit.title} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-5">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            {t.credit.accountsReceivable}
          </p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">
            {formatCurrency(totalAR)}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            {creditSales.filter((s) => s.outstanding > 0).length} outstanding
            sale
            {creditSales.filter((s) => s.outstanding > 0).length !== 1
              ? "s"
              : ""}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-5">
          <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">
            {t.credit.accountsPayable}
          </p>
          <p className="text-2xl font-bold text-red-800 dark:text-red-300 mt-1">
            {formatCurrency(totalAP)}
          </p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
            {creditPOs.filter((p) => p.outstanding > 0).length} outstanding PO
            {creditPOs.filter((p) => p.outstanding > 0).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t.credit.arSection}
          </h2>
        </div>

        {creditSales.length === 0 ? (
          <p className="p-4 text-sm text-gray-400 dark:text-gray-500">
            {t.credit.noOutstandingCredit}
          </p>
        ) : (
          <DataTable
            columns={arColumns}
            rows={arItems}
            rowKey={(s) => s.id}
            emptyMessage={t.credit.noOutstandingCredit}
            unstyled
          />
        )}

        <RoutePagination
          pathname="/credit"
          page={arPage}
          totalPages={arTotalPages}
          pageSize={arPageSize}
          pageParam="arPage"
          limitParam="arLimit"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t.credit.apSection}
          </h2>
        </div>

        {creditPOs.length === 0 ? (
          <p className="p-4 text-sm text-gray-400 dark:text-gray-500">
            {t.credit.noOutstandingPO}
          </p>
        ) : (
          <DataTable
            columns={apColumns}
            rows={apItems}
            rowKey={(po) => po.id}
            emptyMessage={t.credit.noOutstandingPO}
            unstyled
          />
        )}

        <RoutePagination
          pathname="/credit"
          page={apPage}
          totalPages={apTotalPages}
          pageSize={apPageSize}
          pageParam="apPage"
          limitParam="apLimit"
        />
      </div>
    </div>
  );
}
