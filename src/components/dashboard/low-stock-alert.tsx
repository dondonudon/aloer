interface LowStockItem {
  sku: string;
  name: string;
  stock_on_hand: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
  remainingLabel: string;
  title: string;
}

export function LowStockAlert({
  items,
  remainingLabel,
  title,
}: LowStockAlertProps) {
  if (!items.length) return null;
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
    </div>
  );
}
