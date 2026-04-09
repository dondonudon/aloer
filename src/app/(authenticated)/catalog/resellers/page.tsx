import { ResellersClient } from "@/components/settings/resellers-client";
import { getResellers } from "@/lib/actions/resellers";

export default async function CatalogResellersPage() {
  const resellers = await getResellers();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Resellers
      </h1>
      <ResellersClient resellers={resellers} />
    </div>
  );
}
