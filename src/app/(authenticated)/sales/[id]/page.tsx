import { notFound } from "next/navigation";
import { SaleCreditPaymentsClient } from "@/components/sales/sale-credit-payments-client";
import { SaleVoidActions } from "@/components/sales/sale-void-actions";
import { PageHeader } from "@/components/ui/page-header";
import { getSaleCreditPayments } from "@/lib/actions/credit";
import { getSaleWithItems } from "@/lib/actions/sales";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  voided: "bg-red-50 text-red-600",
};

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params;

  let sale: Awaited<ReturnType<typeof getSaleWithItems>>["sale"];
  let items: Awaited<ReturnType<typeof getSaleWithItems>>["items"];

  try {
    const result = await getSaleWithItems(id);
    sale = result.sale;
    items = result.items;
  } catch {
    notFound();
  }

  const creditPayments =
    sale.payment_method === "credit" && sale.status === "completed"
      ? await getSaleCreditPayments(id)
      : [];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={sale.invoice_number}
        backHref="/sales"
        backLabel="Sales"
      >
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            statusColors[sale.status] ?? ""
          }`}
        >
          {sale.status}
        </span>
        <SaleVoidActions saleId={sale.id} status={sale.status} />
      </PageHeader>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>
            <p className="text-sm font-medium capitalize dark:text-gray-100">
              {sale.payment_method}
            </p>
          </div>{" "}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
            <p className="text-sm font-medium dark:text-gray-100">
              {formatDateTime(sale.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {formatCurrency(sale.total_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">COGS</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {formatCurrency(sale.total_cogs)}
            </p>
          </div>
        </div>

        {(sale.resellers as { name: string } | null)?.name && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customer (Reseller)
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {(sale.resellers as { name: string }).name}
            </p>
          </div>
        )}

        {sale.campaign_savings > 0 && (
          <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-sm text-green-600 dark:text-green-400">
            <span>Campaign savings</span>
            <span>- {formatCurrency(sale.campaign_savings)}</span>
          </div>
        )}

        {sale.cart_campaign_discount > 0 && (
          <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-sm text-green-600 dark:text-green-400">
            <span>Cart campaign</span>
            <span>- {formatCurrency(sale.cart_campaign_discount)}</span>
          </div>
        )}

        {sale.discount_amount > 0 && (
          <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-sm text-red-600">
            <span>Discount</span>
            <span>- {formatCurrency(sale.discount_amount)}</span>
          </div>
        )}

        {sale.status === "completed" && (
          <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 font-semibold">
            <span className="text-sm">Gross Profit</span>
            <span className="text-sm text-green-700">
              {formatCurrency(sale.total_amount - sale.total_cogs)}
            </span>
          </div>
        )}

        {sale.status === "voided" && sale.void_reason && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Void Reason
            </p>
            <p className="text-sm text-red-600">{sale.void_reason}</p>
            {sale.voided_at && (
              <p className="text-xs text-gray-400 mt-1">
                Voided at {formatDateTime(sale.voided_at)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Items ({items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-6 font-medium text-gray-500 dark:text-gray-400">
                  Product
                </th>
                <th className="text-right py-3 px-6 font-medium text-gray-500 dark:text-gray-400">
                  Price
                </th>
                <th className="text-right py-3 px-6 font-medium text-gray-500 dark:text-gray-400">
                  Qty
                </th>
                <th className="text-right py-3 px-6 font-medium text-gray-500 dark:text-gray-400">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const product = item.products as {
                  name: string;
                  sku: string;
                } | null;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-6">
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {product?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product?.sku ?? ""}
                      </p>
                    </td>
                    <td className="py-3 px-6 text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3 px-6 text-right text-gray-600 dark:text-gray-400">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-6 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 dark:border-gray-700">
                <td
                  colSpan={3}
                  className="py-3 px-6 text-right font-semibold text-gray-900 dark:text-white"
                >
                  Total
                </td>
                <td className="py-3 px-6 text-right font-bold text-gray-900 dark:text-white">
                  {formatCurrency(sale.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {sale.payment_method === "credit" && sale.status === "completed" && (
        <SaleCreditPaymentsClient
          saleId={sale.id}
          totalAmount={sale.total_amount}
          payments={creditPayments}
        />
      )}
    </div>
  );
}
