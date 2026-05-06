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
        <p className="text-sm text-gray-500 dark:text-gray-300">
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

      {(() => {
        const columns: DataTableColumn<PurchaseOrderRow>[] = [
          {
            id: "poNumber",
            header: t.purchases.poNumber,
            cellClassName: "font-mono text-gray-700 dark:text-gray-300",
            cell: (po) => po.po_number,
          },
          {
            id: "supplier",
            header: t.purchases.supplier,
            cellClassName: "text-gray-900 dark:text-gray-100",
            cell: (po) => po.suppliers?.name || "—",
          },
          {
            id: "payment",
            header: t.purchases.payment,
            cellClassName: "text-gray-600 dark:text-gray-400 capitalize",
            cell: (po) => po.payment_method,
          },
          {
            id: "total",
            header: t.purchases.total,
            align: "right",
            cellClassName: "text-gray-900 dark:text-gray-100",
            cell: (po) => formatCurrency(po.total_amount),
          },
          {
            id: "status",
            header: t.purchases.status,
            align: "center",
            cell: (po) => (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  statusColors[po.status] ?? ""
                }`}
              >
                {po.status}
              </span>
            ),
          },
          {
            id: "date",
            header: t.purchases.date,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (po) => formatDateTime(po.created_at),
          },
          {
            id: "actions",
            header: t.purchases.actions,
            align: "center",
            cell: (po) => (
              <Link
                href={`/purchases/${po.id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t.purchases.view}
              </Link>
            ),
          },
        ];
        return (
          <DataTable
            columns={columns}
            rows={orders}
            rowKey={(po) => po.id}
            emptyMessage={t.purchases.noPOFound}
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
