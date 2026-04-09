"use client";

import { useMemo, useState } from "react";
import type {
  CampaignWithProducts,
  Product,
  SaleItemInput,
  SalePaymentInput,
} from "@/lib/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

/** Shape expected by ReceiptModal. Defined here so pos-client and the modal share the same structure. */
export interface ReceiptData {
  invoiceNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    originalPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  campaignSavings?: number;
  cartCampaignDiscount?: number;
  discount?: { label: string; amount: number };
  total: number;
  payments: SalePaymentInput[];
  isCreditSale?: boolean;
  createdAt: string;
}

/**
 * Encapsulates POS cart state and all pricing logic.
 *
 * Separating this from the rendering components keeps each piece small,
 * independently testable, and free of JSX concerns.
 */
export function useCart(campaigns: CampaignWithProducts[]) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState("");

  // Split active campaigns into: per-product (always / min_product_qty) and
  // cart-total triggered (min_cart_total).  Evaluated once per campaigns change.
  const { productCampaignMap, cartCampaigns } = useMemo(() => {
    const now = new Date();
    const productCampaignMap = new Map<string, CampaignWithProducts>();
    const cartCampaigns: CampaignWithProducts[] = [];

    for (const c of campaigns) {
      if (!c.is_active) continue;
      if (new Date(c.start_date) > now || new Date(c.end_date) < now) continue;

      if (c.trigger_type === "min_cart_total") {
        cartCampaigns.push(c);
      } else {
        // 'always' or 'min_product_qty'
        if (c.campaign_products.length === 0) {
          productCampaignMap.set("__all__", c);
        } else {
          for (const cp of c.campaign_products) {
            if (!productCampaignMap.has(cp.product_id)) {
              productCampaignMap.set(cp.product_id, c);
            }
          }
        }
      }
    }
    return { productCampaignMap, cartCampaigns };
  }, [campaigns]);

  /**
   * Returns the active campaign for a product, enforcing trigger rules.
   * @param quantity — when provided, enforces min_product_qty threshold.
   *                   Omit (or pass 0) for display-only contexts (product grid).
   */
  function getCampaignForProduct(
    productId: string,
    quantity = 0,
  ): CampaignWithProducts | null {
    const campaign =
      productCampaignMap.get(productId) ??
      productCampaignMap.get("__all__") ??
      null;
    if (!campaign) return null;

    if (campaign.trigger_type === "min_product_qty" && quantity > 0) {
      const cp = campaign.campaign_products.find(
        (cp) => cp.product_id === productId,
      );
      const minQty = cp?.min_quantity ?? 1;
      if (quantity < minQty) return null;
    }

    return campaign;
  }

  function getEffectivePrice(product: Product, quantity: number): number {
    let price = product.selling_price;

    if (
      product.bulk_price != null &&
      product.bulk_min_qty != null &&
      quantity >= product.bulk_min_qty
    ) {
      price = product.bulk_price;
    }

    const campaign = getCampaignForProduct(product.id, quantity);
    if (campaign) {
      if (campaign.discount_type === "percentage") {
        price = price * (1 - campaign.discount_value / 100);
      } else {
        price = Math.max(0, price - campaign.discount_value);
      }
    }

    return Math.round(price);
  }

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + getEffectivePrice(item.product, item.quantity) * item.quantity,
    0,
  );

  // Total saved across all cart items due to active per-item campaigns.
  const campaignSavings = cart.reduce((sum, item) => {
    const campaign = getCampaignForProduct(item.product.id, item.quantity);
    if (!campaign) return sum;
    let basePrice = item.product.selling_price;
    if (
      item.product.bulk_price != null &&
      item.product.bulk_min_qty != null &&
      item.quantity >= item.product.bulk_min_qty
    ) {
      basePrice = item.product.bulk_price;
    }
    const effectivePrice = getEffectivePrice(item.product, item.quantity);
    return sum + Math.max(0, (basePrice - effectivePrice) * item.quantity);
  }, 0);

  // Cart-total triggered campaign discount (min_cart_total trigger type).
  // Applies the first qualifying campaign's discount to the whole order.
  const cartCampaignDiscount = (() => {
    if (cartCampaigns.length === 0 || subtotal <= 0) return 0;
    for (const c of cartCampaigns) {
      if (c.trigger_value == null || subtotal < c.trigger_value) continue;
      if (c.discount_type === "percentage") {
        return Math.round(subtotal * Math.min(c.discount_value, 100)) / 100;
      }
      return Math.min(Math.round(c.discount_value), subtotal);
    }
    return 0;
  })();

  const discountAmount = (() => {
    const parsed = parseFloat(discountValue);
    if (!discountValue || Number.isNaN(parsed) || parsed <= 0) return 0;
    if (discountType === "percentage") {
      return Math.round((subtotal * Math.min(parsed, 100)) / 100);
    }
    return Math.min(Math.round(parsed), subtotal);
  })();

  const finalTotal = subtotal - cartCampaignDiscount - discountAmount;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscountValue("");
  }

  /** Builds the items payload for the createSale server action. */
  function buildSaleItems(): SaleItemInput[] {
    return cart.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      price: getEffectivePrice(i.product, i.quantity),
    }));
  }

  /** Builds the receipt display data after a successful checkout. */
  function buildReceiptData(
    invoiceNumber: string,
    payments: SalePaymentInput[],
    isCreditSale?: boolean,
  ): ReceiptData {
    return {
      invoiceNumber,
      items: cart.map((i) => {
        const price = getEffectivePrice(i.product, i.quantity);
        return {
          name: i.product.name,
          quantity: i.quantity,
          price,
          originalPrice: i.product.selling_price,
          subtotal: price * i.quantity,
        };
      }),
      subtotal,
      campaignSavings: campaignSavings > 0 ? campaignSavings : undefined,
      cartCampaignDiscount:
        cartCampaignDiscount > 0 ? cartCampaignDiscount : undefined,
      discount:
        discountAmount > 0
          ? {
              label:
                discountType === "percentage" ? `${discountValue}%` : "Fixed",
              amount: discountAmount,
            }
          : undefined,
      total: finalTotal,
      payments,
      isCreditSale,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    cart,
    discountType,
    discountValue,
    subtotal,
    campaignSavings,
    cartCampaignDiscount,
    discountAmount,
    finalTotal,
    getCampaignForProduct,
    getEffectivePrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setDiscountType,
    setDiscountValue,
    buildSaleItems,
    buildReceiptData,
  };
}
