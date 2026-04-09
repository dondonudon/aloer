"use client";

import { Printer, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
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
  const receiptRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; color: #111; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .mono { font-family: monospace; }
            .small { font-size: 12px; color: #666; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; padding-top: 12px; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
            .sub { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="bold" style="font-size:18px;">${storeName}</div>
            <div class="small">${formatDateTime(receipt.createdAt)}</div>
            <div class="mono" style="margin-top:4px;">${receipt.invoiceNumber}</div>
          </div>
          <div class="divider">
            ${receipt.items
              .map(
                (item) => `
              <div class="row">
                <div>
                  <div>${item.name}</div>
                  <div class="sub">${item.quantity} × ${formatCurrency(item.price)}${
                    item.originalPrice > item.price
                      ? ` <span style="text-decoration:line-through;color:#9ca3af;">${formatCurrency(item.originalPrice)}</span>`
                      : ""
                  }</div>
                </div>
                <div class="bold">${formatCurrency(item.subtotal)}</div>
              </div>`,
              )
              .join("")}
          </div>
          <div class="divider">
            ${
              receipt.campaignSavings
                ? `<div class="row" style="color:#16a34a;">
              <span>Campaign savings</span>
              <span>- ${formatCurrency(receipt.campaignSavings)}</span>
            </div>`
                : ""
            }
            ${
              receipt.cartCampaignDiscount
                ? `<div class="row" style="color:#16a34a;">
              <span>Cart campaign</span>
              <span>- ${formatCurrency(receipt.cartCampaignDiscount)}</span>
            </div>`
                : ""
            }
            ${
              receipt.discount
                ? `
            <div class="row">
              <span>Subtotal</span>
              <span>${formatCurrency(receipt.subtotal)}</span>
            </div>
            <div class="row" style="color:#dc2626;">
              <span>Discount (${receipt.discount.label})</span>
              <span>- ${formatCurrency(receipt.discount.amount)}</span>
            </div>`
                : ""
            }
            <div class="total-row">
              <span>Total</span>
              <span>${formatCurrency(receipt.total)}</span>
            </div>
            ${
              receipt.isCreditSale
                ? `<div class="row" style="color:#d97706;"><span>Payment</span><span>Credit</span></div>`
                : receipt.payments
                    .map(
                      (p) => `<div class="row">
              <span style="text-transform:capitalize;">${p.method}</span>
              <span>${formatCurrency(p.amount)}</span>
            </div>`,
                    )
                    .join("")
            }
          </div>
          <div class="center small" style="margin-top:16px;">Thank you for your purchase!</div>
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
            Receipt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close receipt"
          >
            <X
              className="h-5 w-5 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            />
          </button>
        </div>

        <div ref={receiptRef} className="p-6 print-receipt">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {storeName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDateTime(receipt.createdAt)}
            </p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1">
              {receipt.invoiceNumber}
            </p>
          </div>

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-3 mb-3">
            {receipt.items.map((item) => (
              <div
                key={item.name}
                className="flex justify-between text-sm py-1"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.quantity} ×{" "}
                    {item.originalPrice > item.price && (
                      <span className="line-through mr-1 text-gray-400 dark:text-gray-500">
                        {formatCurrency(item.originalPrice)}
                      </span>
                    )}
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-medium ml-4">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-3 space-y-1">
            {receipt.campaignSavings != null && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Campaign savings</span>
                <span>- {formatCurrency(receipt.campaignSavings)}</span>
              </div>
            )}
            {receipt.cartCampaignDiscount != null && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Cart campaign</span>
                <span>- {formatCurrency(receipt.cartCampaignDiscount)}</span>
              </div>
            )}
            {receipt.discount && (
              <>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(receipt.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({receipt.discount.label})</span>
                  <span>- {formatCurrency(receipt.discount.amount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(receipt.total)}</span>
            </div>
            {receipt.isCreditSale ? (
              <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400 font-medium">
                <span>Payment</span>
                <span>Credit</span>
              </div>
            ) : (
              receipt.payments.map((p) => (
                <div
                  key={p.method}
                  className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="capitalize">{p.method}</span>
                  <span>{formatCurrency(p.amount)}</span>
                </div>
              ))
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Thank you for your purchase!
          </p>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 no-print">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </Button>
          <Button type="button" className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
