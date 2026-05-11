import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PurchasesListClient } from "@/components/purchases/purchases-list-client";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-skeletons";
import { getPurchaseOrders } from "@/lib/actions/purchases";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getServerTranslations } from "@/lib/i18n/server";
import type { Translations } from "@/lib/i18n/translations";
import { parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function PurchasesTable({
  tPromise,
  ordersPromise,
  suppliersPromise,
  page,
  limit,
  search,
  startDate,
  endDate,
  status,
  supplierId,
}: {
  tPromise: Promise<Translations>;
  ordersPromise: ReturnType<typeof getPurchaseOrders>;
  suppliersPromise: ReturnType<typeof getSuppliers>;
  page: number;
  limit: number;
  search: string;
  startDate: string;
  endDate: string;
  status: string;
  supplierId: string;
}) {
  const [, { data: orders, count }, suppliers] = await Promise.all([
    tPromise,
    ordersPromise,
    suppliersPromise,
  ]);
  return (
    <PurchasesListClient
      orders={orders}
      total={count}
      page={page}
      pageSize={limit}
      search={search}
      startDate={startDate}
      endDate={endDate}
      status={status}
      supplierId={supplierId}
      suppliers={suppliers ?? []}
    />
  );
}

export default async function PurchasesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search ?? "";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";
  const status = params.status ?? "";
  const supplierId = params.supplierId ?? "";
  const limit = parsePageSize(params.limit);

  // All three fetches run in parallel. The header renders as soon as
  // translations resolve (cached); the table streams in when DB queries finish.
  const tPromise = getServerTranslations();
  const ordersPromise = getPurchaseOrders({
    search,
    startDate,
    endDate,
    status,
    supplierId,
    page,
    limit,
  });
  const suppliersPromise = getSuppliers();
  const t = await tPromise;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.purchases.title}
        </h1>
        <Link href="/purchases/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.purchases.newPO}
          </Button>
        </Link>
      </div>

      <Suspense fallback={<SkeletonTable rows={10} />}>
        <PurchasesTable
          tPromise={tPromise}
          ordersPromise={ordersPromise}
          suppliersPromise={suppliersPromise}
          page={page}
          limit={limit}
          search={search}
          startDate={startDate}
          endDate={endDate}
          status={status}
          supplierId={supplierId}
        />
      </Suspense>
    </div>
  );
}
