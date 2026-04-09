import { BarChart3, DollarSign, ShoppingCart } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    href: "/reports/balance-sheet",
    label: "Balance Sheet",
    description: "View assets, liabilities, and equity",
    icon: BarChart3,
  },
  {
    href: "/reports/profit-loss",
    label: "Profit & Loss",
    description: "Revenue and expenses over a period",
    icon: DollarSign,
  },
  {
    href: "/reports/sales",
    label: "Sales Summary",
    description: "Daily sales, COGS, and gross profit",
    icon: ShoppingCart,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Reports
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all"
          >
            <div className="p-3 bg-blue-50 rounded-lg">
              <report.icon
                className="h-6 w-6 text-blue-600"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {report.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {report.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
