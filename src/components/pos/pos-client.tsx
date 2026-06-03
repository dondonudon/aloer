"use client";

import { ChevronUp, ShoppingCart } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CartPanel } from "@/components/pos/cart-panel";
import { ProductGrid } from "@/components/pos/product-grid";
import { useStore } from "@/components/ui/store-context";
import { Toast } from "@/components/ui/toast";
import { createSale } from "@/lib/actions/sales";
import { type ReceiptData, useCart } from "@/lib/hooks/use-cart";
import { useToast } from "@/lib/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import type {
  CampaignWithProducts,
  Product,
  Reseller,
  SalePaymentInput,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
  stockByProductId?: Record<string, number>;
  stockBySku?: Record<string, number>;
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
  stockByProductId = {},
  stockBySku = {},
}: POSClientProps) {
  const { t } = useI18n();
  const { storeIconUrl } = useStore();
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
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
    dueDate?: string,
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
      dueDate: isCreditSale ? dueDate : undefined,
    });
    if (result.error) {
      showToast(result.error, "error");
    } else {
      setReceipt(
        buildReceiptData(
          (result.data as { invoice_number?: string } | null)?.invoice_number ??
            "",
          isCreditSale ? [] : payments,
          isCreditSale,
        ),
      );
      clearCart();
      setSelectedResellerId("");
      setCartOpen(false);
      setIdempotencyKey(crypto.randomUUID());
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-9.5rem)] xl:h-[calc(100vh-4rem)]">
        <ProductGrid
          products={products}
          getCampaignForProduct={getCampaignForProduct}
          onAddToCart={addToCart}
          stockByProductId={stockByProductId}
          stockBySku={stockBySku}
        />

        {/* Cart: inline panel on desktop, slide-in drawer on mobile */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm transform shadow-2xl transition-transform duration-200 ease-out xl:relative xl:inset-auto xl:z-auto xl:w-96 xl:max-w-none xl:shrink-0 xl:translate-x-0 xl:shadow-none xl:transition-none ${
            cartOpen ? "translate-x-0" : "translate-x-full"
          }`}
          aria-hidden={!cartOpen}
        >
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
            onClose={() => setCartOpen(false)}
          />
        </aside>

        {cartOpen && (
          <button
            type="button"
            aria-label={t.pos.cart}
            className="fixed inset-0 z-40 bg-black/40 xl:hidden"
            onClick={() => setCartOpen(false)}
          />
        )}
      </div>

      {/* Mobile cart trigger — sticks to the bottom of the viewport */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-between gap-3 border-t border-blue-700/40 bg-blue-600 px-4 text-white shadow-lg active:bg-blue-700 xl:hidden"
        aria-label={`${t.pos.cart} (${cart.length})`}
      >
        <span className="flex items-center gap-3 font-medium">
          <span className="relative">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cart.length > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-gray-900">
                {cart.length}
              </span>
            )}
          </span>
          <span>{t.pos.cart}</span>
        </span>
        <span className="flex items-center gap-2 font-semibold">
          {formatCurrency(finalTotal)}
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

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
    </>
  );
}
