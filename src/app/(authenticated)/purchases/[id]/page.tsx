import { PODetailActions } from "@/components/purchases/po-detail-actions";
import { SupplierPaymentsClient } from "@/components/purchases/supplier-payments-client";
import { PageHeader } from "@/components/ui/page-header";
import { getPurchaseOrderWithItems } from "@/lib/actions/purchases";
import { getSupplierPayments } from "@/lib/actions/supplier-payments";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const { po, items } = await getPurchaseOrderWithItems(id);

  const supplierPayments =
    po.payment_method === "credit" && po.status === "received"
      ? await getSupplierPayments(id)
      : [];

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.cost_price,
    0,
  );

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={po.po_number}
        backHref="/purchases"
        backLabel="Purchase Orders"
      >
        <PODetailActions poId={po.id} status={po.status} />
      </PageHeader>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Created {formatDateTime(po.created_at)}
      </p>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-sm font-medium capitalize dark:text-gray-100">
              {po.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Supplier</p>
            <p className="text-sm font-medium dark:text-gray-100">
              {(po.suppliers as { name: string } | null)?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>
            <p className="text-sm font-medium capitalize dark:text-gray-100">
              {po.payment_method}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-sm font-medium dark:text-gray-100">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
        {po.notes && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {po.notes}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Items
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Product
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Quantity
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Cost Price
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Expiry
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {(item.products as { name: string; sku: string })?.name ??
                      "—"}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(item.cost_price)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {item.expiry_date || "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
