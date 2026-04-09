"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportPdf } from "@/lib/export";
import { useI18n } from "@/lib/i18n/context";
import { getAccountName } from "@/lib/i18n/translations";
import { formatCurrency } from "@/lib/utils";

export interface AccountRow {
  code: string;
  name: string;
  type: string;
  balance: number;
}

interface BalanceSheetClientProps {
  assets: AccountRow[];
  liabilities: AccountRow[];
  equity: AccountRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  /** Either "YYYY-MM" (monthly) or "YYYY" (yearly) */
  period: string;
}

/**
 * Client wrapper for the Balance Sheet report.
 * Renders the account sections and provides a PDF export button.
 */
export function BalanceSheetClient({
  assets,
  liabilities,
  equity,
  totalAssets,
  totalLiabilities,
  totalEquity,
  period,
}: BalanceSheetClientProps) {
  const { t } = useI18n();
  const router = useRouter();

  const isYearly = /^\d{4}$/.test(period);
  const currentYear = new Date().getFullYear();
  // Build a list of selectable years (current year going back 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) =>
    String(currentYear - i),
  );
  function handleExportPdf() {
    const rows: Record<string, unknown>[] = [];

    for (const a of assets) {
      rows.push({
        Section: t.reports.assets,
        Code: a.code,
        Account: getAccountName(a.code, a.name, t),
        Balance: formatCurrency(a.balance),
      });
    }
    rows.push({
      Section: t.reports.assets,
      Code: "",
      Account: `${t.reports.total} ${t.reports.assets}`,
      Balance: formatCurrency(totalAssets),
    });

    for (const l of liabilities) {
      rows.push({
        Section: t.reports.liabilities,
        Code: l.code,
        Account: getAccountName(l.code, l.name, t),
        Balance: formatCurrency(l.balance),
      });
    }
    rows.push({
      Section: t.reports.liabilities,
      Code: "",
      Account: `${t.reports.total} ${t.reports.liabilities}`,
      Balance: formatCurrency(totalLiabilities),
    });

    for (const e of equity) {
      rows.push({
        Section: t.reports.equity,
        Code: e.code,
        Account: getAccountName(e.code, e.name, t),
        Balance: formatCurrency(e.balance),
      });
    }
    rows.push({
      Section: t.reports.equity,
      Code: "",
      Account: `${t.reports.total} ${t.reports.equity}`,
      Balance: formatCurrency(totalEquity),
    });

    rows.push({
      Section: "",
      Code: "",
      Account: t.reports.liabilitiesEquity,
      Balance: formatCurrency(totalLiabilities + totalEquity),
    });

    exportPdf(
      `Balance Sheet — ${period}`,
      [
        { header: "Section", key: "Section" },
        { header: "Code", key: "Code" },
        { header: "Account", key: "Account" },
        { header: "Balance", key: "Balance", align: "right" },
      ],
      rows,
      "balance-sheet",
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                if (isYearly) {
                  // Switch to monthly: use January of that year
                  router.push(`/reports/balance-sheet?period=${period}-01`);
                }
              }}
              className={`px-3 py-1.5 transition-colors ${
                !isYearly
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {t.reports.monthly}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isYearly) {
                  // Switch to yearly: use the year part of current period
                  router.push(
                    `/reports/balance-sheet?period=${period.slice(0, 4)}`,
                  );
                }
              }}
              className={`px-3 py-1.5 transition-colors ${
                isYearly
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {t.reports.yearly}
            </button>
          </div>

          {/* Period picker */}
          {isYearly ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="bs-year"
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {t.reports.year}
              </label>
              <select
                id="bs-year"
                value={period}
                onChange={(e) =>
                  router.push(`/reports/balance-sheet?period=${e.target.value}`)
                }
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label
                htmlFor="bs-month"
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {t.reports.month}
              </label>
              <input
                id="bs-month"
                type="month"
                value={period}
                max={new Date().toISOString().slice(0, 7)}
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(
                      `/reports/balance-sheet?period=${e.target.value}`,
                    );
                  }
                }}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label={t.reports.exportPdf}
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {t.reports.exportPdf}
        </button>
      </div>

      <AccountSection
        title={t.reports.assets}
        items={assets}
        total={totalAssets}
      />
      <AccountSection
        title={t.reports.liabilities}
        items={liabilities}
        total={totalLiabilities}
      />
      <AccountSection
        title={t.reports.equity}
        items={equity}
        total={totalEquity}
      />

      <div className="flex justify-between py-2 border-t-2 border-gray-300 dark:border-gray-600 font-bold dark:text-white">
        <span>{t.reports.liabilitiesEquity}</span>
        <span>{formatCurrency(totalLiabilities + totalEquity)}</span>
      </div>
    </div>
  );
}

function AccountSection({
  title,
  items,
  total,
}: {
  title: string;
  items: AccountRow[];
  total: number;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {title}
      </h2>
      {items.map((a) => (
        <div key={a.code} className="flex justify-between py-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {a.code} — {getAccountName(a.code, a.name, t)}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(a.balance)}
          </span>
        </div>
      ))}
      <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 font-semibold">
        <span className="text-sm text-gray-900 dark:text-white">
          {t.reports.total} {title}
        </span>
        <span className="text-sm text-gray-900 dark:text-white">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
