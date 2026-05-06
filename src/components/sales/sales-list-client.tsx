"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ListFilter } from "@/components/ui/list-filter";
import { Pagination } from "@/components/ui/pagination";
import { exportCsv, exportXlsx } from "@/lib/export";
import { useI18n } from "@/lib/i18n/context";
import type { Sale } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const statusColors: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  voided: "bg-red-50 text-red-600",
};

interface SalesListClientProps {
  sales: Sale[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  startDate: string;
  endDate: string;
  status: string;
}

/**
 * Sales list with server-side filtering, date range, and pagination.
 * Filter state is URL-driven — changes trigger a server refetch.
 */
export function SalesListClient({
  sales,
  total,
  page,
  pageSize,
  search: initialSearch,
  startDate: initialStartDate,
  endDate: initialEndDate,
  status: initialStatus,
}: SalesListClientProps) {
  const { t } = useI18n();
  const SALES_STATUS_OPTIONS = [
    { value: "", label: t.sales.allStatus },
    { value: "completed", label: t.sales.completed },
    { value: "voided", label: t.sales.voided },
  ];
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialSearch);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Keep latest filter values in a ref so the debounce effect can read them
  // without needing them as dependencies (which would re-arm the timer).
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
      if (pageSize !== 10) params.set("limit", String(pageSize));
      if (p > 1) params.set("page", String(p));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, search, startDate, endDate, statusFilter, pageSize],
  );

  const buildLimitHref = useCallback(
    (limit: number) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (statusFilter) params.set("status", statusFilter);
      if (limit !== 10) params.set("limit", String(limit));
      // page intentionally omitted — resets to 1
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, search, startDate, endDate, statusFilter],
  );

  // Navigate immediately when date/status change — reset to page 1
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

  // Debounce search input → URL push (skip on first render).
  // Uses latestFilters ref so we only need [search, router, pathname] as deps.
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

  function toExportRows(data: Sale[]) {
    return data.map((s) => ({
      Invoice: s.invoice_number,
      Payment: s.payment_method,
      Total: s.total_amount,
      COGS: s.total_cogs,
      Profit: s.status === "completed" ? s.total_amount - s.total_cogs : 0,
      Status: s.status,
      Date: formatDateTime(s.created_at),
    }));
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <ListFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.sales.searchInvoice}
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
        statusOptions={SALES_STATUS_OPTIONS}
        idPrefix="sales-list"
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-300">
          {total} sale{total !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void exportXlsx(toExportRows(sales), "sales")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.common.exportXlsx}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.exportXlsx}
          </button>
          <button
            type="button"
            onClick={() => void exportCsv(toExportRows(sales), "sales")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.common.exportCsv}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.exportCsv}
          </button>
        </div>
      </div>

      {(() => {
        const columns: DataTableColumn<Sale>[] = [
          {
            id: "invoice",
            header: t.sales.invoice,
            cellClassName: "font-mono text-gray-700 dark:text-gray-300",
            cell: (s) => s.invoice_number,
          },
          {
            id: "payment",
            header: t.sales.payment,
            cellClassName: "text-gray-600 dark:text-gray-400 capitalize",
            cell: (s) => s.payment_method,
          },
          {
            id: "total",
            header: t.sales.total,
            align: "right",
            cellClassName: "text-gray-900 dark:text-gray-100",
            cell: (s) => formatCurrency(s.total_amount),
          },
          {
            id: "cogs",
            header: t.sales.cogs,
            align: "right",
            cellClassName: "text-gray-500 dark:text-gray-400",
            cell: (s) => formatCurrency(s.total_cogs),
          },
          {
            id: "profit",
            header: t.sales.profit,
            align: "right",
            cellClassName: "font-medium text-gray-900 dark:text-gray-100",
            cell: (s) =>
              s.status === "completed"
                ? formatCurrency(s.total_amount - s.total_cogs)
                : "—",
          },
          {
            id: "status",
            header: t.sales.status,
            align: "center",
            cell: (s) => (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  statusColors[s.status] ?? ""
                }`}
              >
                {s.status}
              </span>
            ),
          },
          {
            id: "date",
            header: t.sales.date,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (s) => formatDateTime(s.created_at),
          },
          {
            id: "actions",
            header: t.sales.actions,
            align: "center",
            cell: (s) => (
              <Link
                href={`/sales/${s.id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t.sales.view}
              </Link>
            ),
          },
        ];
        return (
          <DataTable
            columns={columns}
            rows={sales}
            rowKey={(s) => s.id}
            emptyMessage={t.sales.noSalesFound}
          />
        );
      })()}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={buildHref}
        pageSize={pageSize}
        buildLimitHref={buildLimitHref}
      />
    </div>
  );
}
