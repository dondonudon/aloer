"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { createSaleReturn } from "@/lib/actions/sales";
import { useI18n } from "@/lib/i18n/context";
import type { SaleReturn, SaleReturnItem } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  products: { name: string; sku: string } | null;
}

interface Props {
  saleId: string;
  saleStatus: string;
  saleItems: SaleItem[];
  existingReturns: (SaleReturn & { items: SaleReturnItem[] })[];
}

/**
 * Owner-only partial return action for a completed sale.
 * Shows a modal where the user picks per-item return quantities and refund method.
 * Also renders past return history below the button.
 */
export function SaleReturnActions({
  saleId,
  saleStatus,
  saleItems,
  existingReturns,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refundMethod, setRefundMethod] = useState<"cash" | "transfer">("cash");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Per-item return qty state keyed by product_id
  const [returnQty, setReturnQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const item of saleItems) init[item.product_id] = 0;
    return init;
  });

  // Compute already-returned quantities per product
  const alreadyReturned: Record<string, number> = {};
  for (const ret of existingReturns) {
    for (const ri of ret.items) {
      alreadyReturned[ri.product_id] =
        (alreadyReturned[ri.product_id] ?? 0) + ri.quantity;
    }
  }

  function maxReturnable(item: SaleItem): number {
    return item.quantity - (alreadyReturned[item.product_id] ?? 0);
  }

  const hasReturnable = saleItems.some((item) => maxReturnable(item) > 0);
  const totalRefund = saleItems.reduce((acc, item) => {
    return acc + (returnQty[item.product_id] ?? 0) * item.price;
  }, 0);
  const hasSelectedItems = saleItems.some(
    (item) => (returnQty[item.product_id] ?? 0) > 0,
  );

  function handleClose() {
    setModalOpen(false);
    const reset: Record<string, number> = {};
    for (const item of saleItems) reset[item.product_id] = 0;
    setReturnQty(reset);
    setNotes("");
    setRefundMethod("cash");
  }

  async function handleSubmit() {
    const items = saleItems
      .filter((item) => (returnQty[item.product_id] ?? 0) > 0)
      .map((item) => ({
        product_id: item.product_id,
        quantity: returnQty[item.product_id],
      }));

    if (items.length === 0) return;

    setLoading(true);
    const result = await createSaleReturn({
      sale_id: saleId,
      refund_method: refundMethod,
      notes: notes.trim() || undefined,
      items,
    });

    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message: t.sales.returnCreatedSuccess,
        type: "success",
      });
      handleClose();
      router.refresh();
    }
    setLoading(false);
  }

  if (saleStatus !== "completed") return null;

  return (
    <>
      {hasReturnable && (
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t.sales.processReturn}
        </Button>
      )}

      {existingReturns.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t.sales.returnHistory}
          </h3>
          {existingReturns.map((ret) => (
            <div
              key={ret.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {ret.return_number}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(ret.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {t.sales.refundMethod}:{" "}
                  <span className="capitalize font-medium text-gray-700 dark:text-gray-200">
                    {ret.refund_method}
                  </span>
                </span>
                <span>
                  {t.sales.totalRefund}:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(ret.total_refund)}
                  </span>
                </span>
              </div>
              {ret.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {ret.notes}
                </p>
              )}
              <table className="w-full text-xs mt-1">
                <thead>
                  <tr className="text-gray-400 dark:text-gray-500">
                    <th className="text-left py-1">{t.sales.product}</th>
                    <th className="text-right py-1">{t.sales.qty}</th>
                    <th className="text-right py-1">{t.sales.refundAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {ret.items.map((ri) => (
                    <tr
                      key={ri.id}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-1 text-gray-700 dark:text-gray-300">
                        {ri.products?.name ?? ri.product_id}
                      </td>
                      <td className="py-1 text-right text-gray-600 dark:text-gray-400">
                        {ri.quantity}
                      </td>
                      <td className="py-1 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(ri.refund_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ret.created_by_name && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t.common.by} {ret.created_by_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={t.sales.processReturn}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.sales.returnConfirmNote}
          </p>

          {/* Items table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {t.sales.product}
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">
                    {t.sales.price}
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {t.sales.maxReturn}
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">
                    {t.sales.returnQty}
                  </th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((item) => {
                  const max = maxReturnable(item);
                  return (
                    <tr
                      key={item.product_id}
                      className="border-b border-gray-100 dark:border-gray-700/50"
                    >
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                        <div>{item.products?.name ?? "—"}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          {item.products?.sku}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                        {max}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {max > 0 ? (
                          <input
                            type="number"
                            min={0}
                            max={max}
                            step={1}
                            value={returnQty[item.product_id] ?? 0}
                            onChange={(e) => {
                              const v = Math.min(
                                Math.max(0, Number(e.target.value)),
                                max,
                              );
                              setReturnQty((prev) => ({
                                ...prev,
                                [item.product_id]: v,
                              }));
                            }}
                            className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-right text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Refund method */}
          <Select
            label={t.sales.refundMethod}
            value={refundMethod}
            onChange={(e) =>
              setRefundMethod(e.target.value as "cash" | "transfer")
            }
            options={[
              { value: "cash", label: t.common.cash },
              { value: "transfer", label: t.common.transfer },
            ]}
          />

          {/* Optional notes */}
          <div className="space-y-1">
            <label
              htmlFor="return-notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t.sales.returnNotes}
            </label>
            <textarea
              id="return-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t.sales.returnNotesPlaceholder}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Total refund preview */}
          <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {t.sales.totalRefund}
            </span>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(totalRefund)}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!hasSelectedItems}
            >
              {loading ? t.common.processing : t.sales.confirmReturn}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
