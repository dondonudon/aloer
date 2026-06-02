import Link from "next/link";

interface LowStockAlertProps {
  outOfStockCount: number;
  lowStockCount: number;
  title: string;
  outOfStockLabel: string;
  lowStockLabel: string;
  viewAllLabel: string;
}

export function LowStockAlert({
  outOfStockCount,
  lowStockCount,
  title,
  outOfStockLabel,
  lowStockLabel,
  viewAllLabel,
}: LowStockAlertProps) {
  if (outOfStockCount === 0 && lowStockCount === 0) return null;
  return (
    <Link
      href="/inventory?lowStock=true"
      className="block rounded-xl border border-amber-200 bg-amber-50 p-5 transition-colors hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-amber-800 dark:text-amber-300">
          {title}
        </h2>
        <span className="text-xs text-amber-600 underline dark:text-amber-400">
          {viewAllLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {outOfStockLabel}
          </p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {outOfStockCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {lowStockLabel}
          </p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {lowStockCount}
          </p>
        </div>
      </div>
    </Link>
  );
}
