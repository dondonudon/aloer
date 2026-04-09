"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { CampaignWithProducts, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  /** Returns the active campaign for a product, if any. Provided by useCart. */
  getCampaignForProduct: (productId: string) => CampaignWithProducts | null;
  onAddToCart: (product: Product) => void;
}

/**
 * Searchable product grid for the POS screen.
 *
 * Search state is intentionally local — nothing outside this component needs
 * to observe it, so there's no reason to lift it.
 *
 * Accessibility: each product card is a `<button>` with a descriptive label.
 */
export function ProductGrid({
  products,
  getCampaignForProduct,
  onAddToCart,
}: ProductGridProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Point of Sale
        </h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
          <Input
            placeholder="Search products by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search products"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((product) => {
            const campaign = getCampaignForProduct(product.id);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onAddToCart(product)}
                aria-label={`Add ${product.name} to cart`}
                className="flex flex-col p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all text-left"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {product.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {product.sku}
                </span>
                <span className="text-sm font-semibold text-blue-600 mt-auto pt-2">
                  {formatCurrency(product.selling_price)}
                </span>
                {product.bulk_price != null && product.bulk_min_qty != null && (
                  <span className="text-[10px] text-blue-500 mt-0.5">
                    {formatCurrency(product.bulk_price)} for{" "}
                    {product.bulk_min_qty}+
                  </span>
                )}
                {campaign && campaign.trigger_type !== "min_cart_total" && (
                  <span className="text-[10px] text-orange-600 font-medium mt-0.5">
                    {campaign.trigger_type === "min_product_qty"
                      ? (() => {
                          const cp = campaign.campaign_products.find(
                            (cp) => cp.product_id === product.id,
                          );
                          const minQty = cp?.min_quantity ?? 1;
                          const disc =
                            campaign.discount_type === "percentage"
                              ? `${campaign.discount_value}% off`
                              : `${formatCurrency(campaign.discount_value)} off`;
                          return `Buy ${minQty}+ → ${disc}`;
                        })()
                      : campaign.discount_type === "percentage"
                        ? `${campaign.discount_value}% off`
                        : `${formatCurrency(campaign.discount_value)} off`}
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-8">
              No products found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
