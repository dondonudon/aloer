import { SalesHistoryClient } from "@/components/settings/sales-history-client";
import { getSales } from "@/lib/actions/sales";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function SalesHistoryPage() {
  const [{ data: sales }, t] = await Promise.all([
    getSales({ limit: 200 }),
    getServerTranslations(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.settings.salesHistory}
      </h1>
      <SalesHistoryClient sales={sales} />
    </div>
  );
}
