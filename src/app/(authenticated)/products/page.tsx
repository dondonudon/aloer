import { ProductsClient } from "@/components/products/products-client";
import { getActiveCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";

const VALID_PAGE_SIZES = [10, 20, 50, 100] as const;
type ValidPageSize = (typeof VALID_PAGE_SIZES)[number];

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const search = params.search ?? "";
  const rawLimit = Number(params.limit ?? 10);
  const limit: ValidPageSize = VALID_PAGE_SIZES.includes(
    rawLimit as ValidPageSize,
  )
    ? (rawLimit as ValidPageSize)
    : 10;

  const [{ data: products, count }, categories] = await Promise.all([
    getProducts({ search, page, limit }),
    getActiveCategories(),
  ]);

  return (
    <ProductsClient
      products={products}
      categories={categories}
      total={count}
      page={page}
      pageSize={limit}
      search={search}
    />
  );
}
