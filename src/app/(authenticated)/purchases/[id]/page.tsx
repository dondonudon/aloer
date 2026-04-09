import { PODetailActions } from "@/components/purchases/po-detail-actions";
import { SupplierPaymentsClient } from "@/components/purchases/supplier-payments-client";
import { PageHeader } from "@/components/ui/page-header";
import { getPurchaseOrderWithItems } from "@/lib/actions/purchases";
import { getSupplierPayments } from "@/lib/actions/supplier-payments";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [{ po, items }, t] = await Promise.all([
    getPurchaseOrderWithItems(id),
    getServerTranslations(),
  ]);

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
        backLabel={t.purchases.title}
      >
        <PODetailActions poId={po.id} status={po.status} />
      </PageHeader>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t.purchases.created} {formatDateTime(po.created_at)}
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
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t.purchases.items}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.product}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.quantity}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.costPrice}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.expiry}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.purchases.subtotal}
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
