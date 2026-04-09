import { SuppliersClient } from "@/components/settings/suppliers-client";
import { getSuppliers } from "@/lib/actions/suppliers";

export default async function CatalogSuppliersPage() {
  const suppliers = await getSuppliers();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Suppliers
      </h1>
      <SuppliersClient suppliers={suppliers} />
    </div>
  );
}
