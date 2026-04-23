"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CartPanel } from "@/components/pos/cart-panel";
import { ProductGrid } from "@/components/pos/product-grid";
import { useStore } from "@/components/ui/store-context";
import { Toast } from "@/components/ui/toast";
import { createSale } from "@/lib/actions/sales";
import { type ReceiptData, useCart } from "@/lib/hooks/use-cart";
import { useToast } from "@/lib/hooks/use-toast";
import type {
  CampaignWithProducts,
  Product,
  Reseller,
  SalePaymentInput,
} from "@/lib/types";

const ReceiptModal = dynamic(
  () =>
    import("@/components/pos/receipt-modal").then((mod) => mod.ReceiptModal),
  { ssr: false },
);

interface POSClientProps {
  products: Product[];
  storeName: string;
  campaigns?: CampaignWithProducts[];
  resellers?: Reseller[];
}

/**
 * POS orchestrator — owns only checkout loading state and the receipt overlay.
 *
 * Pricing and cart logic live in `useCart`.
 * Product browsing UI is in `ProductGrid`.
 * Cart display and checkout UI is in `CartPanel`.
 */
export function POSClient({
  products,
  storeName,
  campaigns = [],
  resellers = [],
}: POSClientProps) {
  const { storeIconUrl } = useStore();
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const { toast, showToast, clearToast } = useToast();

  const {
    cart,
    discountType,
    discountValue,
    deliveryFee,
    deliveryFeeAmount,
    subtotal,
    campaignSavings,
    cartCampaignDiscount,
    discountAmount,
    finalTotal,
    hasCostData,
    grossProfit,
    marginPercent,
    getCampaignForProduct,
    getEffectivePrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setDiscountType,
    setDiscountValue,
    setDeliveryFee,
    buildSaleItems,
    buildReceiptData,
  } = useCart(campaigns);

  async function handleCheckout(
    payments: SalePaymentInput[],
    isCreditSale?: boolean,
  ) {
    if (cart.length === 0) return;
    setLoading(true);
    const result = await createSale({
      items: buildSaleItems(),
      payments,
      isCreditSale: isCreditSale ?? false,
      resellerId: selectedResellerId || undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      campaignSavings: campaignSavings > 0 ? campaignSavings : undefined,
      cartCampaignDiscount:
        cartCampaignDiscount > 0 ? cartCampaignDiscount : undefined,
      deliveryFee: deliveryFeeAmount > 0 ? deliveryFeeAmount : undefined,
      idempotencyKey,
    });
    if (result.error) {
      showToast(result.error, "error");
    } else {
      setReceipt(
        buildReceiptData(
          result.data?.invoice_number ?? "",
          isCreditSale ? [] : payments,
          isCreditSale,
        ),
      );
      clearCart();
      setSelectedResellerId("");
      setIdempotencyKey(crypto.randomUUID());
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      <ProductGrid
        products={products}
        getCampaignForProduct={getCampaignForProduct}
        onAddToCart={addToCart}
      />
      <CartPanel
        cart={cart}
        discountType={discountType}
        discountValue={discountValue}
        deliveryFee={deliveryFee}
        deliveryFeeAmount={deliveryFeeAmount}
        subtotal={subtotal}
        campaignSavings={campaignSavings}
        cartCampaignDiscount={cartCampaignDiscount}
        discountAmount={discountAmount}
        finalTotal={finalTotal}
        hasCostData={hasCostData}
        grossProfit={grossProfit}
        marginPercent={marginPercent}
        loading={loading}
        getCampaignForProduct={getCampaignForProduct}
        getEffectivePrice={getEffectivePrice}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onDiscountTypeChange={setDiscountType}
        onDiscountValueChange={setDiscountValue}
        onDeliveryFeeChange={setDeliveryFee}
        onCheckout={handleCheckout}
        resellers={resellers}
        selectedResellerId={selectedResellerId}
        onResellerChange={setSelectedResellerId}
      />
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          storeName={storeName}
          storeLogoUrl={storeIconUrl ?? undefined}
          onClose={() => setReceipt(null)}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </div>
  );
}
