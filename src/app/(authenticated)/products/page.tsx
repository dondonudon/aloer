import { ProductsClient } from "@/components/products/products-client";
import { getProducts } from "@/lib/actions/products";
import { parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search ?? "";
  const limit = parsePageSize(params.limit);

  const { data: products, count } = await getProducts({ search, page, limit });

  return (
    <ProductsClient
      products={products}
      total={count}
      page={page}
      pageSize={limit}
      search={search}
    />
  );
}
