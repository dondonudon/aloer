"use client";

import {
  Banknote,
  Clock,
  CreditCard,
  Minus,
  Percent,
  Plus,
  ShoppingCart,
  SplitSquareHorizontal,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Modal } from "@/components/ui/modal";
import type { CartItem } from "@/lib/hooks/use-cart";
import { useI18n } from "@/lib/i18n/context";
import type {
  CampaignWithProducts,
  Product,
  Reseller,
  SalePaymentInput,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CartPanelProps {
  cart: CartItem[];
  discountType: "percentage" | "fixed";
  discountValue: string;
  deliveryFee: string;
  deliveryFeeAmount: number;
  subtotal: number;
  campaignSavings: number;
  cartCampaignDiscount: number;
  discountAmount: number;
  finalTotal: number;
  hasCostData: boolean;
  grossProfit: number;
  marginPercent: number;
  loading: boolean;
  getCampaignForProduct: (productId: string) => CampaignWithProducts | null;
  getEffectivePrice: (product: Product, quantity: number) => number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onDiscountTypeChange: (type: "percentage" | "fixed") => void;
  onDiscountValueChange: (value: string) => void;
  onDeliveryFeeChange: (value: string) => void;
  onCheckout: (payments: SalePaymentInput[], isCreditSale?: boolean) => void;
  resellers?: Reseller[];
  selectedResellerId?: string;
  onResellerChange?: (id: string) => void;
}

/**
 * Cart panel for the POS screen.
 *
 * Purely presentational — receives all data and callbacks from the parent
 * orchestrator (POSClient). No internal state of its own, which makes it
 * straightforward to test and reason about.
 */
export function CartPanel({
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
  loading,
  getCampaignForProduct,
  getEffectivePrice,
  onUpdateQuantity,
  onRemove,
  onDiscountTypeChange,
  onDiscountValueChange,
  onDeliveryFeeChange,
  onCheckout,
  resellers = [],
  selectedResellerId = "",
  onResellerChange,
}: CartPanelProps) {
  const { t } = useI18n();
  const [splitMode, setSplitMode] = useState(false);
  const [cashAmt, setCashAmt] = useState("");
  const [transferAmt, setTransferAmt] = useState("");
  const [pendingCheckout, setPendingCheckout] = useState<{
    payments: SalePaymentInput[];
    isCredit?: boolean;
    methodLabel: string;
  } | null>(null);

  function resetSplit() {
    setSplitMode(false);
    setCashAmt("");
    setTransferAmt("");
  }

  function handleQuickPay(method: "cash" | "transfer") {
    resetSplit();
    setPendingCheckout({
      payments: [{ method, amount: finalTotal }],
      methodLabel: method === "cash" ? t.common.cash : t.common.transfer,
    });
  }

  function handleCreditSale() {
    resetSplit();
    setPendingCheckout({
      payments: [],
      isCredit: true,
      methodLabel: t.common.credit,
    });
  }

  function handleSplitPay() {
    const cash = parseFloat(cashAmt) || 0;
    const transfer = parseFloat(transferAmt) || 0;
    const payments: SalePaymentInput[] = [];
    if (cash > 0) payments.push({ method: "cash", amount: cash });
    if (transfer > 0) payments.push({ method: "transfer", amount: transfer });
    setPendingCheckout({ payments, methodLabel: "Split" });
  }

  function confirmCheckout() {
    if (!pendingCheckout) return;
    onCheckout(pendingCheckout.payments, pendingCheckout.isCredit);
    setPendingCheckout(null);
    resetSplit();
  }

  function cancelCheckout() {
    setPendingCheckout(null);
  }

  const splitCash = parseFloat(cashAmt) || 0;
  const splitTransfer = parseFloat(transferAmt) || 0;
  const splitRemaining = finalTotal - splitCash - splitTransfer;
  const splitValid =
    splitRemaining === 0 && (splitCash > 0 || splitTransfer > 0);

  return (
    <div className="w-full lg:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ShoppingCart
            className="h-5 w-5 text-gray-600 dark:text-gray-400"
            aria-hidden="true"
          />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t.pos.cart} ({cart.length})
          </h2>
        </div>
      </div>

      {/* Reseller / customer picker */}
      {resellers.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <label
            htmlFor="reseller-select"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
          >
            {t.pos.customer}
          </label>
          <select
            id="reseller-select"
            value={selectedResellerId}
            onChange={(e) => onResellerChange?.(e.target.value)}
            className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t.pos.customer}
          >
            <option value="">{t.pos.none}</option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            {t.pos.cartEmpty}
          </p>
        )}
        {cart.map((item) => {
          const price = getEffectivePrice(item.product, item.quantity);
          const isBulk =
            item.product.bulk_price != null &&
            item.product.bulk_min_qty != null &&
            item.quantity >= item.product.bulk_min_qty;
          const campaign = getCampaignForProduct(item.product.id);
          return (
            <div
              key={item.product.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.product.name}
                  {isBulk && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      {t.pos.bulk}
                    </span>
                  )}
                  {campaign && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                      {t.pos.promo}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {campaign && price < item.product.selling_price && (
                    <span className="line-through mr-1 text-gray-400 dark:text-gray-500">
                      {formatCurrency(item.product.selling_price)}
                    </span>
                  )}
                  {formatCurrency(price)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label={`Decrease quantity of ${item.product.name}`}
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="w-8 text-center text-sm font-medium dark:text-gray-100">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label={`Increase quantity of ${item.product.name}`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.product.id)}
                  className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors ml-1"
                  aria-label={`Remove ${item.product.name} from cart`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-24 text-right">
                {formatCurrency(price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Discount input */}
        <div>
          <label
            htmlFor="discount-value"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
          >
            <Tag className="h-3.5 w-3.5" aria-hidden="true" />
            {t.pos.discount}
          </label>
          <div className="flex gap-1.5">
            <div className="flex rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => {
                  onDiscountTypeChange("percentage");
                  onDiscountValueChange("");
                }}
                className={`px-2.5 py-1.5 flex items-center gap-1 transition-colors ${
                  discountType === "percentage"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
                aria-pressed={discountType === "percentage"}
                aria-label="Percentage discount"
              >
                <Percent className="h-3 w-3" aria-hidden="true" />%
              </button>
              <button
                type="button"
                onClick={() => {
                  onDiscountTypeChange("fixed");
                  onDiscountValueChange("");
                }}
                className={`px-2.5 py-1.5 transition-colors ${
                  discountType === "fixed"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
                aria-pressed={discountType === "fixed"}
                aria-label="Fixed amount discount"
              >
                Rp
              </button>
            </div>
            <div className="flex-1">
              <NumericInput
                id="discount-value"
                placeholder={
                  discountType === "percentage" ? "0 – 100" : t.common.amount
                }
                value={discountValue}
                onChange={(e) => onDiscountValueChange(e.target.value)}
                className="flex-1 text-sm w-full"
                aria-label={t.pos.discount}
              />
            </div>
          </div>
        </div>

        {/* Delivery fee input */}
        <div>
          <label
            htmlFor="delivery-fee"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
          >
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            {t.pos.deliveryFee}
          </label>
          <NumericInput
            id="delivery-fee"
            placeholder={t.common.amount}
            value={deliveryFee}
            onChange={(e) => onDeliveryFeeChange(e.target.value)}
            className="text-sm w-full"
            aria-label={t.pos.deliveryFee}
          />
        </div>

        {/* Totals */}
        <div className="space-y-1">
          {campaignSavings > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                {t.pos.campaignSavings}
              </span>
              <span>- {formatCurrency(campaignSavings)}</span>
            </div>
          )}
          {cartCampaignDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                {t.pos.cartCampaign}
              </span>
              <span>- {formatCurrency(cartCampaignDiscount)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{t.pos.subtotal}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>
                  {t.pos.discount} (
                  {discountType === "percentage"
                    ? `${discountValue}%`
                    : "Fixed"}
                  )
                </span>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
            </>
          )}
          {deliveryFeeAmount > 0 && (
            <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                {t.pos.deliveryFee}
              </span>
              <span>- {formatCurrency(deliveryFeeAmount)}</span>
            </div>
          )}
          {hasCostData && (
            <div
              className={`flex justify-between text-sm font-medium ${
                marginPercent >= 30
                  ? "text-green-600 dark:text-green-400"
                  : marginPercent >= 10
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-red-500 dark:text-red-400"
              }`}
            >
              <span>{t.pos.margin}</span>
              <span>
                {formatCurrency(grossProfit)} ({marginPercent.toFixed(1)}%)
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t.pos.total}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>

        {/* Payment */}
        {!splitMode ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleQuickPay("cash")}
                loading={loading}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-2"
              >
                <Banknote className="h-4 w-4" aria-hidden="true" />
                {t.common.cash}
              </Button>
              <Button
                onClick={() => handleQuickPay("transfer")}
                loading={loading}
                disabled={cart.length === 0}
                variant="secondary"
                className="flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {t.common.transfer}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setSplitMode(true)}
                loading={loading}
                disabled={cart.length === 0}
                variant="secondary"
                className="flex items-center justify-center gap-2 text-xs"
              >
                <SplitSquareHorizontal
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Split
              </Button>
              <Button
                onClick={handleCreditSale}
                loading={loading}
                disabled={cart.length === 0 || !selectedResellerId}
                variant="secondary"
                className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-40"
                title={
                  !selectedResellerId
                    ? t.pos.selectResellerForCredit
                    : undefined
                }
              >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {t.common.credit}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <NumericInput
                label={t.common.cash}
                id="split-cash"
                placeholder="0"
                value={cashAmt}
                onChange={(e) => setCashAmt(e.target.value)}
                aria-label={t.common.cash}
              />
              <NumericInput
                label={t.common.transfer}
                id="split-transfer"
                placeholder="0"
                value={transferAmt}
                onChange={(e) => setTransferAmt(e.target.value)}
                aria-label={t.common.transfer}
              />
            </div>
            <div
              className={`flex justify-between text-xs font-medium px-1 ${
                splitRemaining === 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              <span>{t.pos.remaining}</span>
              <span>
                {formatCurrency(Math.abs(splitRemaining))}
                {splitRemaining < 0 ? " over" : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={resetSplit}
                className="text-xs"
              >
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                onClick={handleSplitPay}
                loading={loading}
                disabled={!splitValid}
                className="text-xs"
              >
                {t.pos.confirm}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={pendingCheckout !== null}
        onClose={cancelCheckout}
        title={t.pos.checkoutConfirmTitle}
      >
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {t.pos.payment}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {pendingCheckout?.methodLabel}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t.pos.total}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(finalTotal)}
            </span>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" onClick={cancelCheckout}>
              {t.common.cancel}
            </Button>
            <Button onClick={confirmCheckout} loading={loading}>
              {t.pos.confirm}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
