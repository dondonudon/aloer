import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { InventoryListClient } from "@/components/inventory/inventory-list-client";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-skeletons";
import { getStockReport } from "@/lib/actions/inventory";
import { getServerTranslations } from "@/lib/i18n/server";
import type { Translations } from "@/lib/i18n/translations";
import { parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function InventoryTable({
  tPromise,
  dataPromise,
  page,
  pageSize,
  search,
  lowStockOnly,
}: {
  tPromise: Promise<Translations>;
  dataPromise: ReturnType<typeof getStockReport>;
  page: number;
  pageSize: number;
  search: string;
  lowStockOnly: boolean;
}) {
  const [, stockReport] = await Promise.all([tPromise, dataPromise]);
  const stock = Array.isArray(stockReport) ? stockReport : [];
  return (
    <InventoryListClient
      key={`${page}-${pageSize}-${search}-${lowStockOnly}`}
      stock={stock}
      initialPage={page}
      initialPageSize={pageSize}
      initialSearch={search}
      initialLowStockOnly={lowStockOnly}
    />
  );
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.limit);
  const search = params.search ?? "";
  const lowStockOnly = params.lowStock === "true";

  // Both fetches start in parallel. The header resolves as soon as translations
  // are available (cached); the table streams in when the stock query finishes.
  const tPromise = getServerTranslations();
  const dataPromise = getStockReport();
  const t = await tPromise;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.inventory.title}
        </h1>
        <Link href="/inventory/adjustments/new">
          <Button>
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            {t.inventory.newAdjustment}
          </Button>
        </Link>
      </div>

      <Suspense fallback={<SkeletonTable rows={10} />}>
        <InventoryTable
          tPromise={tPromise}
          dataPromise={dataPromise}
          page={page}
          pageSize={pageSize}
          search={search}
          lowStockOnly={lowStockOnly}
        />
      </Suspense>

      <div className="flex justify-end">
        <Link href="/inventory/adjustments">
          <Button variant="ghost" size="sm">
            {t.inventory.viewAdjustmentHistory}
          </Button>
        </Link>
      </div>
    </div>
  );
}
