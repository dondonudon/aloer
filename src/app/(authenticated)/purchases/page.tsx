import { Plus } from "lucide-react";
import Link from "next/link";
import { PurchasesListClient } from "@/components/purchases/purchases-list-client";
import { Button } from "@/components/ui/button";
import { getPurchaseOrders } from "@/lib/actions/purchases";
import { getServerTranslations } from "@/lib/i18n/server";

const VALID_PAGE_SIZES = [10, 20, 50, 100] as const;
type ValidPageSize = (typeof VALID_PAGE_SIZES)[number];

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PurchasesPage({ searchParams }: Props) {
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

  const [t, { data: orders, count }] = await Promise.all([
    getServerTranslations(),
    getPurchaseOrders({
      search,
      startDate,
      endDate,
      status,
      page,
      limit,
    }),
  ]);

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

      <PurchasesListClient
        orders={orders}
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
