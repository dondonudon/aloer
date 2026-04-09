"use client";

import { Printer, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import type { SalePaymentInput } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  subtotal: number;
}

interface ReceiptData {
  invoiceNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  campaignSavings?: number;
  cartCampaignDiscount?: number;
  discount?: { label: string; amount: number };
  total: number;
  payments: SalePaymentInput[];
  isCreditSale?: boolean;
  createdAt: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData;
  storeName: string;
  onClose: () => void;
}

/**
 * Receipt modal displayed after a successful sale.
 * Prints by opening a new window with receipt HTML.
 */
export function ReceiptModal({
  receipt,
  storeName,
  onClose,
}: ReceiptModalProps) {
  const { t } = useI18n();
  const receiptRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=320,height=700");
    if (!printWindow) return;

    const totalPaid = receipt.isCreditSale
      ? 0
      : receipt.payments.reduce((sum, p) => sum + p.amount, 0);
    const change = totalPaid > receipt.total ? totalPaid - receipt.total : 0;

    const SEP_DOUBLE = "================================";
    const SEP_SINGLE = "--------------------------------";

    const padLine = (left: string, right: string, width = 32) => {
      const gap = width - left.length - right.length;
      return `${left}${" ".repeat(Math.max(1, gap))}${right}`;
    };

    const itemLines = receipt.items
      .map((item) => {
        const priceLabel =
          item.originalPrice > item.price
            ? `${item.quantity} x ${formatCurrency(item.price)} [SALE]`
            : `${item.quantity} x ${formatCurrency(item.price)}`;
        return `
          <div style="margin-bottom:4px;">
            <div style="word-break:break-word;">${item.name}</div>
            <div>${padLine(priceLabel, formatCurrency(item.subtotal))}</div>
          </div>`;
      })
      .join("");

    const paymentLines = receipt.isCreditSale
      ? `<div>${padLine(t.pos.payment, t.common.credit)}</div>`
      : receipt.payments
          .map(
            (p) =>
              `<div>${padLine(p.method.charAt(0).toUpperCase() + p.method.slice(1), formatCurrency(p.amount))}</div>`,
          )
          .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.invoiceNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm 4mm; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.4;
              width: 72mm;
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .sep { white-space: pre; letter-spacing: 0; margin: 6px 0; }
            .total-line { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:15px;margin-bottom:2px;">${storeName}</div>
          <div class="center" style="font-size:11px;">${formatDateTime(receipt.createdAt)}</div>
          <div class="center">${receipt.invoiceNumber}</div>
          <div class="sep">${SEP_DOUBLE}</div>
          ${itemLines}
          <div class="sep">${SEP_SINGLE}</div>
          ${
            receipt.campaignSavings
              ? `<div>${padLine(t.pos.campaignSavings, `- ${formatCurrency(receipt.campaignSavings)}`)}</div>`
              : ""
          }
          ${
            receipt.cartCampaignDiscount
              ? `<div>${padLine(t.pos.cartCampaign, `- ${formatCurrency(receipt.cartCampaignDiscount)}`)}</div>`
              : ""
          }
          ${
            receipt.discount
              ? `<div>${padLine(t.pos.subtotal, formatCurrency(receipt.subtotal))}</div>
                 <div>${padLine(`Disc (${receipt.discount.label})`, `- ${formatCurrency(receipt.discount.amount)}`)}</div>`
              : ""
          }
          <div class="sep">${SEP_DOUBLE}</div>
          <div class="total-line">${padLine(t.pos.total, formatCurrency(receipt.total))}</div>
          <div class="sep">${SEP_SINGLE}</div>
          ${paymentLines}
          ${change > 0 ? `<div>${padLine("Change", formatCurrency(change))}</div>` : ""}
          <div class="sep">${SEP_DOUBLE}</div>
          <div class="center" style="margin-top:8px;font-size:11px;">${t.pos.thankYou}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.pos.receipt}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.pos.closeReceipt}
          >
            <X
              className="h-5 w-5 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Thermal paper preview */}
        <div className="px-4 py-2 overflow-y-auto max-h-[60vh]">
          <div
            ref={receiptRef}
            className="bg-white text-black font-mono text-xs leading-snug mx-auto p-3"
            style={{ width: "100%", maxWidth: "288px" }}
          >
            <div className="text-center font-bold text-sm mb-0.5">
              {storeName}
            </div>
            <div className="text-center text-[11px] text-gray-600">
              {formatDateTime(receipt.createdAt)}
            </div>
            <div className="text-center text-[11px] mb-1">
              {receipt.invoiceNumber}
            </div>

            <div className="border-t border-b border-dashed border-black py-2 my-1 space-y-1.5">
              {receipt.items.map((item) => (
                <div key={item.name}>
                  <div className="break-words">{item.name}</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {item.quantity} x{" "}
                      {item.originalPrice > item.price && (
                        <span className="line-through text-gray-400 mr-1">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      )}
                      {formatCurrency(item.price)}
                      {item.originalPrice > item.price && (
                        <span className="ml-1 text-gray-500">[SALE]</span>
                      )}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-0.5 py-1">
              {receipt.campaignSavings != null && (
                <div className="flex justify-between">
                  <span>{t.pos.campaignSavings}</span>
                  <span>- {formatCurrency(receipt.campaignSavings)}</span>
                </div>
              )}
              {receipt.cartCampaignDiscount != null && (
                <div className="flex justify-between">
                  <span>{t.pos.cartCampaign}</span>
                  <span>- {formatCurrency(receipt.cartCampaignDiscount)}</span>
                </div>
              )}
              {receipt.discount && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>{t.pos.subtotal}</span>
                    <span>{formatCurrency(receipt.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disc ({receipt.discount.label})</span>
                    <span>- {formatCurrency(receipt.discount.amount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-black mt-1 pt-1">
              <div className="flex justify-between font-bold text-sm">
                <span>{t.pos.total}</span>
                <span>{formatCurrency(receipt.total)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black mt-1 pt-1 space-y-0.5">
              {receipt.isCreditSale ? (
                <div className="flex justify-between">
                  <span>{t.pos.payment}</span>
                  <span>{t.common.credit}</span>
                </div>
              ) : (
                <>
                  {receipt.payments.map((p) => (
                    <div key={p.method} className="flex justify-between">
                      <span className="capitalize">{p.method}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  {(() => {
                    const totalPaid = receipt.payments.reduce(
                      (sum, p) => sum + p.amount,
                      0,
                    );
                    const change = totalPaid - receipt.total;
                    return change > 0 ? (
                      <div className="flex justify-between">
                        <span>Change</span>
                        <span>{formatCurrency(change)}</span>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </div>

            <div className="border-t border-dashed border-black mt-1 pt-2 text-center text-[11px] text-gray-600">
              {t.pos.thankYou}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 no-print">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t.pos.print}
          </Button>
          <Button type="button" className="flex-1" onClick={onClose}>
            {t.pos.done}
          </Button>
        </div>
      </div>
    </div>
  );
}
