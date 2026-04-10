import { SuppliersClient } from "@/components/settings/suppliers-client";
import { RoutePagination } from "@/components/ui/route-pagination";
import { getSuppliers } from "@/lib/actions/suppliers";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CatalogSuppliersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.limit);
  const suppliers = await getSuppliers();
  const { items, totalPages } = paginate(suppliers, page, pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Suppliers
      </h1>
      <SuppliersClient suppliers={items} />
      <RoutePagination
        pathname="/catalog/suppliers"
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
      />
    </div>
  );
}
