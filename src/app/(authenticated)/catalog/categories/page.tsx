import { CategoriesClient } from "@/components/settings/categories-client";
import { RoutePagination } from "@/components/ui/route-pagination";
import { getCategories } from "@/lib/actions/categories";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CatalogCategoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.limit);
  const categories = await getCategories();
  const { items, totalPages } = paginate(categories, page, pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Categories
      </h1>
      <CategoriesClient categories={items} />
      <RoutePagination
        pathname="/catalog/categories"
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
      />
    </div>
  );
}
