import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getAdjustments } from "@/lib/actions/inventory";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/utils";

export default async function AdjustmentsPage() {
  const [adjustments, t] = await Promise.all([
    getAdjustments(),
    getServerTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.inventory.adjustmentHistory}
        backHref="/inventory"
        backLabel={t.inventory.title}
      >
        <Link href="/inventory/adjustments/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.inventory.newAdjustment}
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.inventory.number}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.inventory.reason}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.inventory.notes}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.common.date}
                </th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj) => (
                <tr
                  key={adj.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                    {adj.adjustment_number}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 capitalize">
                    {adj.reason}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {adj.notes || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {formatDateTime(adj.created_at)}
                  </td>
                </tr>
              ))}
              {adjustments.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    {t.inventory.noAdjustmentsYet}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
