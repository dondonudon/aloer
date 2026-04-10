import { Plus } from "lucide-react";
import Link from "next/link";
import { PurchasesListClient } from "@/components/purchases/purchases-list-client";
import { Button } from "@/components/ui/button";
import { getPurchaseOrders } from "@/lib/actions/purchases";
import { getServerTranslations } from "@/lib/i18n/server";
import { parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PurchasesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search ?? "";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";
  const status = params.status ?? "";
  const limit = parsePageSize(params.limit);

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
