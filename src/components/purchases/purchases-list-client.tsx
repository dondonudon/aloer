"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListFilter } from "@/components/ui/list-filter";
import { Pagination } from "@/components/ui/pagination";
import { exportCsv, exportXlsx } from "@/lib/export";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-50 text-yellow-700",
  received: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

interface PurchaseOrderRow {
  id: string;
  po_number: string;
  suppliers: { name: string } | null;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface PurchasesListClientProps {
  orders: PurchaseOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  startDate: string;
  endDate: string;
  status: string;
}

/**
 * Purchase orders list with server-side filtering, date range, status,
 * and pagination. Filter state is URL-driven.
 */
export function PurchasesListClient({
  orders,
  total,
  page,
  pageSize,
  search: initialSearch,
  startDate: initialStartDate,
  endDate: initialEndDate,
  status: initialStatus,
}: PurchasesListClientProps) {
  const { t } = useI18n();
  const PO_STATUS_OPTIONS = [
    { value: "", label: t.purchases.allStatus },
    { value: "draft", label: t.purchases.draft },
    { value: "received", label: t.purchases.received },
    { value: "cancelled", label: t.purchases.cancelled },
  ];
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialSearch);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const latestFilters = useRef({
    startDate: initialStartDate,
    endDate: initialEndDate,
    statusFilter: initialStatus,
  });
  useEffect(() => {
    latestFilters.current = { startDate, endDate, statusFilter };
  });

  const buildHref = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (statusFilter) params.set("status", statusFilter);
      if (p > 1) params.set("page", String(p));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, search, startDate, endDate, statusFilter],
  );

  function navigate(overrides: {
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const s = overrides.search ?? search;
    const sd = overrides.startDate ?? startDate;
    const ed = overrides.endDate ?? endDate;
    const st = overrides.status ?? statusFilter;
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (sd) params.set("startDate", sd);
    if (ed) params.set("endDate", ed);
    if (st) params.set("status", st);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const {
      startDate: sd,
      endDate: ed,
      statusFilter: st,
    } = latestFilters.current;
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sd) params.set("startDate", sd);
      if (ed) params.set("endDate", ed);
      if (st) params.set("status", st);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 400);
    return () => clearTimeout(t);
  }, [search, router, pathname]);

  function toExportRows(data: PurchaseOrderRow[]) {
    return data.map((po) => ({
      "PO Number": po.po_number,
      Supplier: po.suppliers?.name ?? "—",
      Payment: po.payment_method,
      Total: po.total_amount,
      Status: po.status,
      Date: formatDateTime(po.created_at),
    }));
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <ListFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.purchases.searchPO}
        startDate={startDate}
        onStartDateChange={(v) => {
          setStartDate(v);
          navigate({ startDate: v });
        }}
        endDate={endDate}
        onEndDateChange={(v) => {
          setEndDate(v);
          navigate({ endDate: v });
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          navigate({ status: v });
        }}
        statusOptions={PO_STATUS_OPTIONS}
        idPrefix="po-list"
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} purchase order{total !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportXlsx(toExportRows(orders), "purchase-orders")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.common.exportXlsx}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.exportXlsx}
          </button>
          <button
            type="button"
            onClick={() => exportCsv(toExportRows(orders), "purchase-orders")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.common.exportCsv}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.exportCsv}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.poNumber}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.supplier}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.payment}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.total}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.status}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.date}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr
                  key={po.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                    {po.po_number}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {po.suppliers?.name || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 capitalize">
                    {po.payment_method}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(po.total_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        statusColors[po.status] ?? ""
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {formatDateTime(po.created_at)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/purchases/${po.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {t.purchases.view}
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    {t.purchases.noPOFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
