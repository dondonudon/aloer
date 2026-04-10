import { SalesHistoryClient } from "@/components/settings/sales-history-client";
import { RoutePagination } from "@/components/ui/route-pagination";
import { getSales } from "@/lib/actions/sales";
import { getServerTranslations } from "@/lib/i18n/server";
import { parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SalesHistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.limit);
  const [{ data: sales, count }, t] = await Promise.all([
    getSales({ page, limit: pageSize }),
    getServerTranslations(),
  ]);
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.settings.salesHistory}
      </h1>
      <SalesHistoryClient sales={sales} />
      <RoutePagination
        pathname="/sales/history"
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
      />
    </div>
  );
}
