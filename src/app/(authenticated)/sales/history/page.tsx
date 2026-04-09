import { SalesHistoryClient } from "@/components/settings/sales-history-client";
import { getSales } from "@/lib/actions/sales";

export default async function SalesHistoryPage() {
  const sales = await getSales({ limit: 200 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Sales History
      </h1>
      <SalesHistoryClient sales={sales.data} />
    </div>
  );
}
