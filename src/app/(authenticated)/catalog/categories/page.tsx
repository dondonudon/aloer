import { CategoriesClient } from "@/components/settings/categories-client";
import { getCategories } from "@/lib/actions/categories";

export default async function CatalogCategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Categories
      </h1>
      <CategoriesClient categories={categories} />
    </div>
  );
}
