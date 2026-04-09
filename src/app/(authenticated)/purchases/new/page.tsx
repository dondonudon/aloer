import { NewPurchaseOrderClient } from "@/components/purchases/new-po-client";
import { getActiveProducts } from "@/lib/actions/products";
import { getSuppliers } from "@/lib/actions/suppliers";

export default async function NewPurchaseOrderPage() {
  const [products, suppliers] = await Promise.all([
    getActiveProducts(),
    getSuppliers(),
  ]);

  return <NewPurchaseOrderClient products={products} suppliers={suppliers} />;
}
