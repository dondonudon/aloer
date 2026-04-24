import Link from "next/link";

interface LowStockItem {
  sku: string;
  name: string;
  stock_on_hand: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
  totalCount: number;
  remainingLabel: string;
  title: string;
  viewAllLabel: string;
}

export function LowStockAlert({
  items,
  totalCount,
  remainingLabel,
  title,
  viewAllLabel,
}: LowStockAlertProps) {
  if (!totalCount) return null;
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-5">
      <h2 className="text-base font-semibold text-amber-800 dark:text-amber-400 mb-2">
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.sku}
            className="text-sm text-amber-700 dark:text-amber-300"
          >
            {item.name} ({item.sku}) — {item.stock_on_hand} {remainingLabel}
          </li>
        ))}
      </ul>
      {totalCount > 5 && (
        <Link
          href="/inventory?lowStock=true"
          className="mt-3 inline-block text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
        >
          {viewAllLabel}
        </Link>
      )}
    </div>
  );
}
