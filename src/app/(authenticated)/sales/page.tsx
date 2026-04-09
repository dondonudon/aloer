import Link from "next/link";
import { SalesListClient } from "@/components/sales/sales-list-client";
import { getSales } from "@/lib/actions/sales";
import { getServerTranslations } from "@/lib/i18n/server";

const VALID_PAGE_SIZES = [10, 20, 50, 100] as const;
type ValidPageSize = (typeof VALID_PAGE_SIZES)[number];

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const search = params.search ?? "";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";
  const status = params.status ?? "";
  const rawLimit = Number(params.limit ?? 10);
  const limit: ValidPageSize = VALID_PAGE_SIZES.includes(
    rawLimit as ValidPageSize,
  )
    ? (rawLimit as ValidPageSize)
    : 10;

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
