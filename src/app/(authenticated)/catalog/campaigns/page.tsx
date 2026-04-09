import { CampaignsClient } from "@/components/settings/campaigns-client";
import { getCampaigns } from "@/lib/actions/campaigns";
import { getActiveProducts } from "@/lib/actions/products";

export default async function CatalogCampaignsPage() {
  const [campaigns, products] = await Promise.all([
    getCampaigns(),
    getActiveProducts(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Campaigns
      </h1>
      <CampaignsClient campaigns={campaigns} products={products} />
    </div>
  );
}
