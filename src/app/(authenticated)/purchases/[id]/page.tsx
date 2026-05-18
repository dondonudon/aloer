import { PODetailActions } from "@/components/purchases/po-detail-actions";
import { POReturnActions } from "@/components/purchases/po-return-actions";
import { POVoidActions } from "@/components/purchases/po-void-actions";
import { SupplierPaymentsClient } from "@/components/purchases/supplier-payments-client";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  getPurchaseOrderWithItems,
  getPurchaseReturns,
} from "@/lib/actions/purchases";
import { getSupplierPayments } from "@/lib/actions/supplier-payments";
import { getServerTranslations } from "@/lib/i18n/server";
import { resolveBackHref } from "@/lib/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-50 text-gray-700",
  received: "bg-green-50 text-green-700",
  cancelled: "bg-yellow-50 text-yellow-700",
  voided: "bg-red-50 text-red-600",
};

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const backHref = resolveBackHref(sp, "/purchases");

  // Run all queries concurrently.
  // getSupplierPayments returns [] for non-credit POs.
  // getPurchaseReturns returns [] when no returns have been made.
  const [{ po, items }, supplierPaymentsData, purchaseReturnsResult, t] =
    await Promise.all([
      getPurchaseOrderWithItems(id),
      getSupplierPayments(id),
      getPurchaseReturns(id),
      getServerTranslations(),
    ]);

  // Only surface payments for credit POs that have been received.
  const supplierPayments =
    po.payment_method === "credit" && po.status === "received"
      ? supplierPaymentsData
      : [];

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.cost_price,
    0,
  );

  type Item = (typeof items)[number];
  const itemColumns: DataTableColumn<Item>[] = [
    {
      id: "product",
      header: t.purchases.product,
      cellClassName: "text-gray-900 dark:text-gray-100",
      cell: (i) =>
        (i.products as { name: string; sku: string } | null)?.name ?? "—",
    },
    {
      id: "quantity",
      header: t.purchases.quantity,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (i) => i.quantity,
    },
    {
      id: "costPrice",
      header: t.purchases.costPrice,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (i) => formatCurrency(i.cost_price),
    },
    {
      id: "expiry",
      header: t.purchases.expiry,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (i) => i.expiry_date || "—",
    },
    {
      id: "subtotal",
      header: t.purchases.subtotal,
      align: "right",
      cellClassName: "font-medium text-gray-900 dark:text-gray-100",
      cell: (i) => formatCurrency(i.subtotal),
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={po.po_number}
        backHref={backHref}
        backLabel={t.purchases.title}
      >
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            statusColors[po.status] ?? ""
          }`}
        >
          {po.status}
        </span>
        <PODetailActions poId={po.id} status={po.status} />
        <POVoidActions poId={po.id} status={po.status} />
        <POReturnActions
          poId={po.id}
          poStatus={po.status}
          poItems={items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            cost_price: item.cost_price,
            subtotal: item.subtotal,
            products: item.products as { name: string; sku: string } | null,
          }))}
          existingReturns={purchaseReturnsResult.returns}
        />
      </PageHeader>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t.purchases.created} {formatDateTime(po.created_at)}
        {po.created_by_name && (
          <span className="ml-1">
            · {t.common.createdBy} {po.created_by_name}
          </span>
        )}
      </p>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.purchases.status}
            </p>
            <p className="text-sm font-medium capitalize dark:text-gray-100">
              {po.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.purchases.supplier}
            </p>
            <p className="text-sm font-medium dark:text-gray-100">
              {(po.suppliers as { name: string } | null)?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.purchases.payment}
            </p>
            <p className="text-sm font-medium capitalize dark:text-gray-100">
              {po.payment_method}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.purchases.total}
            </p>
            <p className="text-sm font-medium dark:text-gray-100">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
        {po.notes && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.purchases.notes}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {po.notes}
            </p>
          </div>
        )}

        {po.status === "voided" && po.void_reason && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.purchases.voidReason}
            </p>
            <p className="text-sm text-red-600">{po.void_reason}</p>
            {po.voided_at && (
              <p className="text-xs text-gray-400 mt-1">
                {formatDateTime(po.voided_at)}
                {po.voided_by_name && (
                  <span className="ml-1">
                    · {t.common.voidedBy} {po.voided_by_name}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t.purchases.items}
          </h2>
        </div>
        <DataTable
          columns={itemColumns}
          rows={items}
          rowKey={(i) => i.id}
          emptyMessage={t.purchases.noItemsAdded}
          unstyled
        />
      </div>

      {po.payment_method === "credit" && po.status === "received" && (
        <SupplierPaymentsClient
          poId={po.id}
          totalAmount={total}
          payments={supplierPayments}
        />
      )}
    </div>
  );
}
