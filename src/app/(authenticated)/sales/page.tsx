import Link from "next/link";
import { SalesListClient } from "@/components/sales/sales-list-client";
import { getSales } from "@/lib/actions/sales";
import { getServerTranslations } from "@/lib/i18n/server";
import { parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search ?? "";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";
  const status = params.status ?? "";
  const limit = parsePageSize(params.limit);

  const [t, { data: sales, count }] = await Promise.all([
    getServerTranslations(),
    getSales({ search, startDate, endDate, status, page, limit }),
  ]);

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

      <SalesListClient
        sales={sales}
        total={count}
        page={page}
        pageSize={limit}
        search={search}
        startDate={startDate}
        endDate={endDate}
        status={status}
      />
    </div>
  );
}
