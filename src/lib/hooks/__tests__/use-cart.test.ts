import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCart } from "@/lib/hooks/use-cart";
import type { CampaignWithProducts, Product } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Coffee",
    sku: "SKU-001",
    category: null,
    unit: "cup",
    selling_price: 10000,
    bulk_price: null,
    bulk_min_qty: null,
    latest_cost_price: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

const now = new Date();
const yesterday = new Date(now.getTime() - 86400_000).toISOString();
const tomorrow = new Date(now.getTime() + 86400_000).toISOString();

function makeActiveCampaign(
  overrides: Partial<CampaignWithProducts> = {},
): CampaignWithProducts {
  return {
    id: "campaign-1",
    name: "10% off",
    discount_type: "percentage",
    discount_value: 10,
    start_date: yesterday,
    end_date: tomorrow,
    is_active: true,
    trigger_type: "always",
    trigger_value: null,
    created_by: null,
    created_at: yesterday,
    campaign_products: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCart — basic cart operations", () => {
  it("starts with an empty cart", () => {
    const { result } = renderHook(() => useCart([]));
    expect(result.current.cart).toHaveLength(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.finalTotal).toBe(0);
  });

  it("addToCart adds a product with quantity 1", () => {
    const product = makeProduct();
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(1);
    expect(result.current.subtotal).toBe(10000);
  });

  it("addToCart increments quantity when the same product is added again", () => {
    const product = makeProduct();
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.subtotal).toBe(20000);
  });

  it("updateQuantity adjusts quantity and removes item when it reaches 0", () => {
    const product = makeProduct();
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.updateQuantity(product.id, -1);
    });

    expect(result.current.cart).toHaveLength(0);
  });

  it("removeFromCart removes only the targeted product", () => {
    const p1 = makeProduct({ id: "p1", name: "Coffee" });
    const p2 = makeProduct({ id: "p2", name: "Tea" });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(p1);
      result.current.addToCart(p2);
      result.current.removeFromCart("p1");
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].product.id).toBe("p2");
  });

  it("clearCart empties the cart and resets discount", () => {
    const product = makeProduct();
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.setDiscountValue("10");
      result.current.clearCart();
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.discountValue).toBe("");
  });
});

describe("useCart — pricing with bulk price", () => {
  it("applies bulk price when quantity meets the minimum", () => {
    const product = makeProduct({
      selling_price: 10000,
      bulk_price: 8000,
      bulk_min_qty: 5,
    });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.updateQuantity(product.id, 4); // quantity = 5
    });

    expect(result.current.getEffectivePrice(product, 5)).toBe(8000);
    expect(result.current.subtotal).toBe(8000 * 5);
  });

  it("uses normal price when quantity is below bulk threshold", () => {
    const product = makeProduct({
      selling_price: 10000,
      bulk_price: 8000,
      bulk_min_qty: 5,
    });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.getEffectivePrice(product, 1)).toBe(10000);
  });
});

describe("useCart — campaign discounts", () => {
  it("applies a percentage campaign discount to a product", () => {
    const campaign = makeActiveCampaign({
      discount_type: "percentage",
      discount_value: 10, // 10% off
      campaign_products: [], // applies to all products
    });
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(product);
    });

    // 10000 - 10% = 9000
    expect(result.current.getEffectivePrice(product, 1)).toBe(9000);
    expect(result.current.subtotal).toBe(9000);
  });

  it("applies a fixed campaign discount to a product", () => {
    const campaign = makeActiveCampaign({
      discount_type: "fixed",
      discount_value: 2000,
      campaign_products: [],
    });
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.getEffectivePrice(product, 1)).toBe(8000);
  });

  it("does not apply an inactive campaign", () => {
    const campaign = makeActiveCampaign({ is_active: false });
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.getEffectivePrice(product, 1)).toBe(10000);
  });

  it("does not apply an expired campaign", () => {
    const expired = makeActiveCampaign({
      start_date: new Date(Date.now() - 2 * 86400_000).toISOString(),
      end_date: new Date(Date.now() - 86400_000).toISOString(),
    });
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([expired]));

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.getEffectivePrice(product, 1)).toBe(10000);
  });

  it("applies a min_cart_total campaign when subtotal meets the threshold", () => {
    const campaign = makeActiveCampaign({
      trigger_type: "min_cart_total",
      trigger_value: 50000,
      discount_type: "fixed",
      discount_value: 5000,
    });
    const product = makeProduct({ selling_price: 60000 });
    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(product);
    });

    // subtotal = 60000, qualifies for 5000 off → finalTotal = 55000
    expect(result.current.subtotal).toBe(60000);
    expect(result.current.cartCampaignDiscount).toBe(5000);
    expect(result.current.finalTotal).toBe(55000);
  });
});

describe("useCart — manual discounts", () => {
  it("applies a percentage manual discount to the subtotal", () => {
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.setDiscountType("percentage");
      result.current.setDiscountValue("20"); // 20% off
    });

    expect(result.current.discountAmount).toBe(2000);
    expect(result.current.finalTotal).toBe(8000);
  });

  it("applies a fixed manual discount to the subtotal", () => {
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.setDiscountType("fixed");
      result.current.setDiscountValue("3000");
    });

    expect(result.current.discountAmount).toBe(3000);
    expect(result.current.finalTotal).toBe(7000);
  });

  it("caps a fixed manual discount at the subtotal (no negative total)", () => {
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.setDiscountType("fixed");
      result.current.setDiscountValue("99999");
    });

    expect(result.current.finalTotal).toBe(0);
  });
});

describe("useCart — buildSaleItems", () => {
  it("returns one item per cart entry with correct price", () => {
    const product = makeProduct({ selling_price: 15000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.addToCart(product); // qty = 2
    });

    const items = result.current.buildSaleItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      productId: product.id,
      quantity: 2,
      price: 15000,
    });
  });
});

// ---------------------------------------------------------------------------
// useCart — updateQuantity with positive delta
// ---------------------------------------------------------------------------

describe("useCart — updateQuantity with positive delta", () => {
  it("increases quantity when a positive delta is given", () => {
    const product = makeProduct({ selling_price: 5000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product); // qty = 1
      result.current.updateQuantity(product.id, 2); // qty = 3
    });

    expect(result.current.cart[0].quantity).toBe(3);
    expect(result.current.subtotal).toBe(15000);
  });
});

// ---------------------------------------------------------------------------
// useCart — campaignSavings
// ---------------------------------------------------------------------------

describe("useCart — campaignSavings", () => {
  it("reports savings when a percentage campaign reduces item price", () => {
    const campaign = makeActiveCampaign({
      discount_type: "percentage",
      discount_value: 20, // 20% off
      campaign_products: [],
    });
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(product);
    });

    // original 10000 - discounted 8000 = 2000 savings per item
    expect(result.current.campaignSavings).toBe(2000);
  });

  it("reports zero savings when no campaign is active", () => {
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.campaignSavings).toBe(0);
  });

  it("multiplies savings across quantity", () => {
    const campaign = makeActiveCampaign({
      discount_type: "fixed",
      discount_value: 1000,
      campaign_products: [],
    });
    const product = makeProduct({ selling_price: 5000 });
    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(product);
      result.current.addToCart(product); // qty = 2
    });

    // 1000 savings × 2 items = 2000
    expect(result.current.campaignSavings).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// useCart — product-specific campaign
// ---------------------------------------------------------------------------

describe("useCart — product-specific campaign", () => {
  it("applies a campaign only to the targeted product", () => {
    const targeted = makeProduct({ id: "targeted", selling_price: 10000 });
    const other = makeProduct({ id: "other", selling_price: 10000 });

    const campaign = makeActiveCampaign({
      discount_type: "percentage",
      discount_value: 50,
      campaign_products: [
        { product_id: "targeted", min_quantity: null } as never,
      ],
    });

    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(targeted);
      result.current.addToCart(other);
    });

    expect(result.current.getEffectivePrice(targeted, 1)).toBe(5000);
    expect(result.current.getEffectivePrice(other, 1)).toBe(10000);
    // subtotal = 5000 + 10000 = 15000
    expect(result.current.subtotal).toBe(15000);
  });

  it("respects min_product_qty threshold on targeted campaigns", () => {
    const product = makeProduct({ id: "prod", selling_price: 10000 });
    const campaign = makeActiveCampaign({
      trigger_type: "min_product_qty",
      discount_type: "percentage",
      discount_value: 30,
      campaign_products: [{ product_id: "prod", min_quantity: 3 } as never],
    });

    const { result } = renderHook(() => useCart([campaign]));

    // below threshold — no discount
    expect(result.current.getEffectivePrice(product, 2)).toBe(10000);
    // at threshold — discount applies
    expect(result.current.getEffectivePrice(product, 3)).toBe(7000);
  });
});

// ---------------------------------------------------------------------------
// useCart — buildReceiptData
// ---------------------------------------------------------------------------

describe("useCart — buildReceiptData", () => {
  it("populates receipt fields correctly for a simple sale", () => {
    const product = makeProduct({ selling_price: 10000, name: "Espresso" });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.addToCart(product); // qty = 2
    });

    const receipt = result.current.buildReceiptData("INV-001", [
      { method: "cash", amount: 20000 },
    ]);

    expect(receipt.invoiceNumber).toBe("INV-001");
    expect(receipt.items).toHaveLength(1);
    expect(receipt.items[0].name).toBe("Espresso");
    expect(receipt.items[0].quantity).toBe(2);
    expect(receipt.items[0].price).toBe(10000);
    expect(receipt.items[0].subtotal).toBe(20000);
    expect(receipt.subtotal).toBe(20000);
    expect(receipt.total).toBe(20000);
    expect(receipt.payments).toHaveLength(1);
    expect(receipt.isCreditSale).toBeUndefined();
  });

  it("includes discount in receipt when a manual discount is set", () => {
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
      result.current.setDiscountType("percentage");
      result.current.setDiscountValue("10"); // 10% off → 1000
    });

    const receipt = result.current.buildReceiptData("INV-002", []);

    expect(receipt.discount).toBeDefined();
    expect(receipt.discount?.amount).toBe(1000);
    expect(receipt.total).toBe(9000);
  });

  it("marks credit sales", () => {
    const product = makeProduct({ selling_price: 5000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
    });

    const receipt = result.current.buildReceiptData("INV-003", [], true);
    expect(receipt.isCreditSale).toBe(true);
  });

  it("omits discount field when no discount is applied", () => {
    const product = makeProduct({ selling_price: 5000 });
    const { result } = renderHook(() => useCart([]));

    act(() => {
      result.current.addToCart(product);
    });

    const receipt = result.current.buildReceiptData("INV-004", []);
    expect(receipt.discount).toBeUndefined();
  });

  it("includes campaignSavings in receipt when a campaign reduces price", () => {
    const campaign = makeActiveCampaign({
      discount_type: "percentage",
      discount_value: 10,
      campaign_products: [],
    });
    const product = makeProduct({ selling_price: 10000 });
    const { result } = renderHook(() => useCart([campaign]));

    act(() => {
      result.current.addToCart(product);
    });

    const receipt = result.current.buildReceiptData("INV-005", []);
    expect(receipt.campaignSavings).toBe(1000);
  });
});
