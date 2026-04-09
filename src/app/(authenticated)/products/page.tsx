import { ProductsClient } from "@/components/products/products-client";
import { getActiveCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const search = params.search ?? "";

  const [{ data: products, count }, categories] = await Promise.all([
    getProducts({ search, page, limit: PAGE_SIZE }),
    getActiveCategories(),
  ]);

  return (
    <ProductsClient
      products={products}
      categories={categories}
      total={count}
      page={page}
      pageSize={PAGE_SIZE}
      search={search}
    />
  );
}
