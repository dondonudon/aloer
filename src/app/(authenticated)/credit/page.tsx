import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  getOutstandingCreditPOs,
  getOutstandingCreditSales,
} from "@/lib/actions/credit";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function CreditPage() {
  const [creditSales, creditPOs, t] = await Promise.all([
    getOutstandingCreditSales(),
    getOutstandingCreditPOs(),
    getServerTranslations(),
  ]);

  const totalAR = creditSales.reduce((sum, s) => sum + s.outstanding, 0);
  const totalAP = creditPOs.reduce((sum, p) => sum + p.outstanding, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t.credit.title} />

      {/* Summary cards */}
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

      {/* AR – Credit Sales */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.invoice}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.reseller}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.date}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.total}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.collected}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.outstanding}
                  </th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {creditSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {(sale.resellers as { name: string }[] | null)?.[0]
                        ?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDateTime(sale.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                      {formatCurrency(sale.collected)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <span
                        className={
                          sale.outstanding > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        {formatCurrency(sale.outstanding)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t.credit.view}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AP – Credit Purchase Orders */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.poNumber}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.supplier}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.date}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.total}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.paid}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.outstanding}
                  </th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {creditPOs.map((po) => (
                  <tr
                    key={po.id}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                      {po.po_number}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {(po.suppliers as { name: string }[] | null)?.[0]?.name ||
                        "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDateTime(po.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(po.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                      {formatCurrency(po.paid)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <span
                        className={
                          po.outstanding > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        {formatCurrency(po.outstanding)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/purchases/${po.id}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t.credit.view}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
