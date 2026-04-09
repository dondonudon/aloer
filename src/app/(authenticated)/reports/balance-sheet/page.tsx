import { BalanceSheetClient } from "@/components/reports/balance-sheet-client";
import { PageHeader } from "@/components/ui/page-header";
import { getBalanceSheet } from "@/lib/actions/reports";

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const result = await getBalanceSheet(period);

  if ("error" in result) {
    return <p className="text-red-600">{result.error}</p>;
  }

  const accounts = result.data ?? [];
  const assets = accounts.filter((a) => a.type === "asset");
  const liabilities = accounts.filter((a) => a.type === "liability");
  const equity = accounts.filter((a) => a.type === "equity");

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

  const currentPeriod = period ?? new Date().toISOString().slice(0, 7);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Balance Sheet"
        backHref="/reports"
        backLabel="Reports"
      />
      <BalanceSheetClient
        assets={assets}
        liabilities={liabilities}
        equity={equity}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        totalEquity={totalEquity}
        period={currentPeriod}
      />
    </div>
  );
}
