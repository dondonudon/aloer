import { ResellersClient } from "@/components/settings/resellers-client";
import { RoutePagination } from "@/components/ui/route-pagination";
import { getResellers } from "@/lib/actions/resellers";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CatalogResellersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.limit);
  const resellers = await getResellers();
  const { items, totalPages } = paginate(resellers, page, pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Resellers
      </h1>
      <ResellersClient resellers={items} />
      <RoutePagination
        pathname="/catalog/resellers"
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
      />
    </div>
  );
}
