import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { InventoryListClient } from "@/components/inventory/inventory-list-client";
import { Button } from "@/components/ui/button";
import { getStockReport } from "@/lib/actions/inventory";

export default async function InventoryPage() {
  const stockReport = await getStockReport();
  const stock = Array.isArray(stockReport) ? stockReport : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventory
        </h1>
        <Link href="/inventory/adjustments/new">
          <Button>
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            New Adjustment
          </Button>
        </Link>
      </div>

      <InventoryListClient stock={stock} />

      <div className="flex justify-end">
        <Link href="/inventory/adjustments">
          <Button variant="ghost" size="sm">
            View Adjustment History
          </Button>
        </Link>
      </div>
    </div>
  );
}
