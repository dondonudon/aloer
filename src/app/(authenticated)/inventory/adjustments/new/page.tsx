import { NewAdjustmentClient } from "@/components/inventory/new-adjustment-client";
import { getActiveProducts } from "@/lib/actions/products";

export default async function NewAdjustmentPage() {
  const products = await getActiveProducts();

  return <NewAdjustmentClient products={products} />;
}
