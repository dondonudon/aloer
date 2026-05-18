import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getInventoryBatches } from "@/lib/actions/inventory";
import { getServerTranslations } from "@/lib/i18n/server";
import { resolveBackHref } from "@/lib/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InventoryDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Inventory detail page showing batch breakdown for a single product.
 */
export default async function InventoryDetailPage({
  params,
  searchParams,
}: InventoryDetailPageProps) {
  const [sp, batches, t] = await Promise.all([
    searchParams,
    params.then(({ id }) => getInventoryBatches(id)),
    getServerTranslations(),
  ]);
  const backHref = resolveBackHref(sp, "/inventory");

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

  // Pre-number batches so the column can render "#1", "#2", … without a row index.
  const indexedBatches = batches.map((b, i) => ({ ...b, _index: i + 1 }));
  type IndexedBatch = (typeof indexedBatches)[number];

  const columns: DataTableColumn<IndexedBatch>[] = [
    {
      id: "batch",
      header: t.inventory.batch,
      cellClassName: "font-mono text-gray-700 dark:text-gray-300",
      cell: (b) => `#${b._index}`,
    },
    {
      id: "source",
      header: t.inventory.source,
      cellClassName: "text-gray-600 dark:text-gray-400 capitalize",
      cell: (b) => b.reference_type?.replace("_", " ") ?? "—",
    },
    {
      id: "qtyIn",
      header: t.inventory.qtyIn,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (b) => b.quantity_in,
    },
    {
      id: "remaining",
      header: t.inventory.remaining,
      align: "right",
      cell: (b) => (
        <span
          className={`font-medium ${
            b.quantity_remaining <= 5
              ? "text-red-600"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {b.quantity_remaining}
        </span>
      ),
    },
    {
      id: "costPrice",
      header: t.purchases.costPrice,
      align: "right",
      cellClassName: "text-gray-700 dark:text-gray-300",
      cell: (b) => formatCurrency(b.cost_price),
    },
    {
      id: "value",
      header: t.inventory.value,
      align: "right",
      cellClassName: "text-gray-900 dark:text-gray-100 font-medium",
      cell: (b) => formatCurrency(b.quantity_remaining * b.cost_price),
    },
    {
      id: "expiry",
      header: t.inventory.expiry,
      cell: (b) => {
        if (!b.expiry_date) return <span className="text-gray-400">—</span>;
        const isExpired = new Date(b.expiry_date) < now;
        const isExpiringSoon = new Date(b.expiry_date) < thirtyDaysFromNow;
        return (
          <span
            className={
              isExpired
                ? "text-red-600 font-medium"
                : isExpiringSoon
                  ? "text-yellow-600"
                  : "text-gray-600 dark:text-gray-400"
            }
          >
            {formatDate(b.expiry_date)}
            {isExpired && ` (${t.inventory.expiredLabel})`}
          </span>
        );
      },
    },
    {
      id: "added",
      header: t.inventory.added,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (b) => formatDate(b.created_at),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={productName}
        backHref={backHref}
        backLabel={t.inventory.title}
      >
        <p className="text-sm text-gray-500">
          {productSku} · {totalQty} units · {formatCurrency(totalValue)} value
        </p>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={indexedBatches}
        rowKey={(b) => b.id}
        emptyMessage={t.inventory.noBatches}
      />
    </div>
  );
}
