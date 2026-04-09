"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { voidSale } from "@/lib/actions/sales";
import type { Sale } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  sales: Sale[];
}

const statusColors: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  voided: "bg-red-50 text-red-600",
};

export function SalesHistoryClient({ sales }: Props) {
  const router = useRouter();
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleVoid() {
    if (!voidingId || !voidReason.trim()) return;

    setLoading(true);
    const result = await voidSale(voidingId, voidReason);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Sale voided", type: "success" });
      router.refresh();
    }
    setVoidingId(null);
    setVoidReason("");
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Sales History
      </h2>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Invoice
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Payment
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                    {sale.invoice_number}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 capitalize">
                    {sale.payment_method}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        statusColors[sale.status] ?? ""
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {formatDateTime(sale.created_at)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sale.status === "completed" && (
                      <button
                        type="button"
                        onClick={() => setVoidingId(sale.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium"
                        aria-label={`Void sale ${sale.invoice_number}`}
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Void
                      </button>
                    )}
                    {sale.status === "voided" && sale.void_reason && (
                      <span className="text-xs text-gray-400">
                        {sale.void_reason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    No sales yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!voidingId}
        onClose={() => setVoidingId(null)}
        title="Void Sale"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will reverse the sale, restore inventory, and create a reversal
            journal entry. This action cannot be undone.
          </p>
          <Input
            label="Reason for voiding"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            required
            placeholder="e.g. Customer cancelled, wrong items"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setVoidingId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleVoid}
              disabled={loading || !voidReason.trim()}
            >
              {loading ? "Processing..." : "Void Sale"}
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
    </div>
  );
}
