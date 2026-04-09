"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { getProfitLoss } from "@/lib/actions/reports";
import { exportPdf } from "@/lib/export";
import { useI18n } from "@/lib/i18n/context";
import { getAccountName } from "@/lib/i18n/translations";
import { formatCurrency } from "@/lib/utils";

interface PnLRow {
  code: string;
  name: string;
  type: string;
  amount: number;
}

export function ProfitLossClient() {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${today.slice(0, 8)}01`;

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<PnLRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const result = await getProfitLoss(startDate, `${endDate}T23:59:59`);
    if ("data" in result && result.data) {
      setData(result.data);
    }
    setLoading(false);
  }

  const revenue = data?.filter((r) => r.type === "revenue") ?? [];
  const expenses = data?.filter((r) => r.type === "expense") ?? [];
  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={t.reports.profitLoss}
        backHref="/reports"
        backLabel={t.reports.title}
      />

      <div className="flex items-end gap-4">
        <Input
          label={t.reports.startDate}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label={t.reports.endDate}
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? t.reports.loading : t.reports.generate}
        </Button>
      </div>

      {data && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.reports.revenue}
            </h2>
            {revenue.map((r) => (
              <div key={r.code} className="flex justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {r.code} — {getAccountName(r.code, r.name, t)}
                </span>
                <span className="text-sm font-medium text-green-700">
                  {formatCurrency(r.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 font-semibold">
              <span className="text-sm">{t.reports.totalRevenue}</span>
              <span className="text-sm text-green-700">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.reports.expenses}
            </h2>
            {expenses.map((r) => (
              <div key={r.code} className="flex justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {r.code} — {getAccountName(r.code, r.name, t)}
                </span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(r.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 font-semibold">
              <span className="text-sm">{t.reports.totalExpenses}</span>
              <span className="text-sm text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="flex justify-between py-2 border-t-2 border-gray-300 dark:border-gray-600 font-bold text-lg dark:text-white">
            <span>{t.reports.netProfit}</span>
            <span
              className={netProfit >= 0 ? "text-green-700" : "text-red-600"}
            >
              {formatCurrency(netProfit)}
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() =>
                exportPdf(
                  `Profit & Loss — ${startDate} to ${endDate}`,
                  [
                    { header: "Code", key: "Code" },
                    { header: "Account", key: "Account" },
                    { header: "Type", key: "Type" },
                    { header: "Amount", key: "Amount", align: "right" },
                  ],
                  data.map((r) => ({
                    Code: r.code,
                    Account: getAccountName(r.code, r.name, t),
                    Type: r.type,
                    Amount: formatCurrency(r.amount),
                  })),
                  "profit-loss",
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label={t.reports.exportPdf}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {t.reports.exportPdf}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
