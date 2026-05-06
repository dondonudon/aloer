import { POSClient } from "@/components/pos/pos-client";
import { getActiveCampaigns } from "@/lib/actions/campaigns";
import { getStockReport } from "@/lib/actions/inventory";
import { getActiveProducts } from "@/lib/actions/products";
import { getActiveResellers } from "@/lib/actions/resellers";
import { getStoreSettings } from "@/lib/actions/store-settings";
import type { StockReportRow } from "@/lib/types";

export default async function POSPage() {
  const [products, storeSettings, campaigns, resellers, stockReport] =
    await Promise.all([
      getActiveProducts(),
      getStoreSettings(),
      getActiveCampaigns(),
      getActiveResellers(),
      getStockReport(),
    ]);

  const stockByProductId: Record<string, number> = {};
  const stockBySku: Record<string, number> = {};
  for (const row of (stockReport ?? []) as StockReportRow[]) {
    if (row.id) stockByProductId[row.id] = row.stock_on_hand;
    if (row.sku) stockBySku[row.sku] = row.stock_on_hand;
  }

  return (
    <POSClient
      products={products}
      storeName={storeSettings.store_name}
      campaigns={campaigns}
      resellers={resellers}
      stockByProductId={stockByProductId}
      stockBySku={stockBySku}
    />
  );
}
