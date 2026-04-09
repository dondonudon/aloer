"use client";

import { Download } from "lucide-react";
import { exportPdf } from "@/lib/export";
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
}: BalanceSheetClientProps) {
  function handleExportPdf() {
    const rows: Record<string, unknown>[] = [];

    for (const a of assets) {
      rows.push({
        Section: "Assets",
        Code: a.code,
        Account: a.name,
        Balance: formatCurrency(a.balance),
      });
    }
    rows.push({
      Section: "Assets",
      Code: "",
      Account: "Total Assets",
      Balance: formatCurrency(totalAssets),
    });

    for (const l of liabilities) {
      rows.push({
        Section: "Liabilities",
        Code: l.code,
        Account: l.name,
        Balance: formatCurrency(l.balance),
      });
    }
    rows.push({
      Section: "Liabilities",
      Code: "",
      Account: "Total Liabilities",
      Balance: formatCurrency(totalLiabilities),
    });

    for (const e of equity) {
      rows.push({
        Section: "Equity",
        Code: e.code,
        Account: e.name,
        Balance: formatCurrency(e.balance),
      });
    }
    rows.push({
      Section: "Equity",
      Code: "",
      Account: "Total Equity",
      Balance: formatCurrency(totalEquity),
    });

    rows.push({
      Section: "",
      Code: "",
      Account: "Liabilities + Equity",
      Balance: formatCurrency(totalLiabilities + totalEquity),
    });

    exportPdf(
      "Balance Sheet",
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
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {assets.length + liabilities.length + equity.length} accounts
        </span>
        <button
          type="button"
          onClick={handleExportPdf}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Export balance sheet as PDF"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export PDF
        </button>
      </div>

      <AccountSection title="Assets" items={assets} total={totalAssets} />
      <AccountSection
        title="Liabilities"
        items={liabilities}
        total={totalLiabilities}
      />
      <AccountSection title="Equity" items={equity} total={totalEquity} />

      <div className="flex justify-between py-2 border-t-2 border-gray-300 dark:border-gray-600 font-bold dark:text-white">
        <span>Liabilities + Equity</span>
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
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {title}
      </h2>
      {items.map((a) => (
        <div key={a.code} className="flex justify-between py-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {a.code} — {a.name}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(a.balance)}
          </span>
        </div>
      ))}
      <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 font-semibold">
        <span className="text-sm text-gray-900 dark:text-white">
          Total {title}
        </span>
        <span className="text-sm text-gray-900 dark:text-white">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
