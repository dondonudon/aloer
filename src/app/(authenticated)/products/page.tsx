import { Suspense } from "react";
import { ProductsClient } from "@/components/products/products-client";
import { SkeletonTable } from "@/components/ui/loading-skeletons";
import { getActiveCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import { parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseActive(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

async function ProductsContent({
  dataPromise,
  categoriesPromise,
  page,
  limit,
  search,
  category,
  unit,
  active,
  minPrice,
  maxPrice,
}: {
  dataPromise: ReturnType<typeof getProducts>;
  categoriesPromise: ReturnType<typeof getActiveCategories>;
  page: number;
  limit: number;
  search: string;
  category: string;
  unit: string;
  active: string;
  minPrice: string;
  maxPrice: string;
}) {
  const [{ data: products, count }, categories] = await Promise.all([
    dataPromise,
    categoriesPromise,
  ]);
  return (
    <ProductsClient
      products={products}
      total={count}
      page={page}
      pageSize={limit}
      categories={categories.map((c) => c.name)}
      filters={{ search, category, unit, active, minPrice, maxPrice }}
    />
  );
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const limit = parsePageSize(params.limit);
  const search = params.search ?? "";
  const category = params.category ?? "";
  const unit = params.unit ?? "";
  const active = params.active ?? "";
  const minPrice = params.minPrice ?? "";
  const maxPrice = params.maxPrice ?? "";

  // Both DB queries run in parallel and stream in together.
  const dataPromise = getProducts({
    search,
    page,
    limit,
    category: category || undefined,
    unit: unit || undefined,
    isActive: parseActive(active),
    minPrice: parseOptionalNumber(minPrice),
    maxPrice: parseOptionalNumber(maxPrice),
  });
  const categoriesPromise = getActiveCategories();

  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <ProductsContent
        dataPromise={dataPromise}
        categoriesPromise={categoriesPromise}
        page={page}
        limit={limit}
        search={search}
        category={category}
        unit={unit}
        active={active}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
    </Suspense>
  );
}
