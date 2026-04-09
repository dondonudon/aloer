import { POSClient } from "@/components/pos/pos-client";
import { getActiveCampaigns } from "@/lib/actions/campaigns";
import { getActiveProducts } from "@/lib/actions/products";
import { getActiveResellers } from "@/lib/actions/resellers";
import { getStoreSettings } from "@/lib/actions/store-settings";

export default async function POSPage() {
  const [products, storeSettings, campaigns, resellers] = await Promise.all([
    getActiveProducts(),
    getStoreSettings(),
    getActiveCampaigns(),
    getActiveResellers(),
  ]);

  return (
    <POSClient
      products={products}
      storeName={storeSettings.store_name}
      campaigns={campaigns}
      resellers={resellers}
    />
  );
}
