import Link from "next/link";
import { Suspense } from "react";
import { SalesListClient } from "@/components/sales/sales-list-client";
import { SkeletonTable } from "@/components/ui/loading-skeletons";
import { getSales } from "@/lib/actions/sales";
import { getServerTranslations } from "@/lib/i18n/server";
import type { Translations } from "@/lib/i18n/translations";
import { parsePage, parsePageSize } from "@/lib/pagination";
import type { Sale } from "@/lib/types";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function SalesTable({
  tPromise,
  dataPromise,
  page,
  limit,
  search,
  startDate,
  endDate,
  status,
  paymentMethod,
}: {
  tPromise: Promise<Translations>;
  dataPromise: ReturnType<typeof getSales>;
  page: number;
  limit: number;
  search: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentMethod: string;
}) {
  const [, { data: sales, count }] = await Promise.all([tPromise, dataPromise]);
  return (
    <SalesListClient
      sales={sales as Sale[]}
      total={count}
      page={page}
      pageSize={limit}
      search={search}
      startDate={startDate}
      endDate={endDate}
      status={status}
      paymentMethod={paymentMethod}
    />
  );
}

export default async function SalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search ?? "";
  const today = new Date();
  const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const startDate =
    params.startDate !== undefined ? params.startDate : defaultStart;
  const endDate = params.endDate ?? "";
  const status = params.status ?? "";
  const paymentMethod = params.paymentMethod ?? "";
  const limit = parsePageSize(params.limit);

  // Kick off both fetches in parallel — translations are fast (cached),
  // data query runs concurrently. The header renders as soon as translations
  // resolve; the table streams in once the DB query completes.
  const tPromise = getServerTranslations();
  const dataPromise = getSales({
    search,
    startDate,
    endDate,
    status,
    paymentMethod,
    page,
    limit,
  });
  const t = await tPromise;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.sales.title}
        </h1>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {t.sales.newSale}
        </Link>
      </div>

      <Suspense fallback={<SkeletonTable rows={10} />}>
        <SalesTable
          tPromise={tPromise}
          dataPromise={dataPromise}
          page={page}
          limit={limit}
          search={search}
          startDate={startDate}
          endDate={endDate}
          status={status}
          paymentMethod={paymentMethod}
        />
      </Suspense>
    </div>
  );
}
