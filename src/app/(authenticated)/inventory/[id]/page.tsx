import { PageHeader } from "@/components/ui/page-header";
import { getInventoryBatches } from "@/lib/actions/inventory";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InventoryDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Inventory detail page showing batch breakdown for a single product.
 */
export default async function InventoryDetailPage({
  params,
}: InventoryDetailPageProps) {
  const { id } = await params;
  const [batches, t] = await Promise.all([
    getInventoryBatches(id),
    getServerTranslations(),
  ]);

  const productName =
    (batches[0]?.products as { name: string; sku: string } | undefined)?.name ??
    "Product";
  const productSku =
    (batches[0]?.products as { name: string; sku: string } | undefined)?.sku ??
    "";

  const totalQty = batches.reduce((s, b) => s + b.quantity_remaining, 0);
  const totalValue = batches.reduce(
    (s, b) => s + b.quantity_remaining * b.cost_price,
    0,
  );

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);

  return (
    <div className="space-y-4">
      <PageHeader
        title={productName}
        backHref="/inventory"
        backLabel={t.inventory.title}
      >
        <p className="text-sm text-gray-500">
          {productSku} · {totalQty} units · {formatCurrency(totalValue)} value
        </p>
      </PageHeader>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.inventory.batch}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.inventory.source}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.inventory.qtyIn}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.inventory.remaining}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.purchases.costPrice}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.inventory.value}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.inventory.expiry}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.inventory.added}
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, idx) => {
                const isExpiringSoon =
                  batch.expiry_date &&
                  new Date(batch.expiry_date) < thirtyDaysFromNow;
                const isExpired =
                  batch.expiry_date && new Date(batch.expiry_date) < now;
                return (
                  <tr
                    key={batch.id}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 capitalize">
                      {batch.reference_type?.replace("_", " ") ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {batch.quantity_in}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-medium ${
                          batch.quantity_remaining <= 5
                            ? "text-red-600"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {batch.quantity_remaining}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(batch.cost_price)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-medium">
                      {formatCurrency(
                        batch.quantity_remaining * batch.cost_price,
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {batch.expiry_date ? (
                        <span
                          className={
                            isExpired
                              ? "text-red-600 font-medium"
                              : isExpiringSoon
                                ? "text-yellow-600"
                                : "text-gray-600 dark:text-gray-400"
                          }
                        >
                          {formatDate(batch.expiry_date)}
                          {isExpired && ` (${t.inventory.expiredLabel})`}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDate(batch.created_at)}
                    </td>
                  </tr>
                );
              })}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    {t.inventory.noBatches}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
