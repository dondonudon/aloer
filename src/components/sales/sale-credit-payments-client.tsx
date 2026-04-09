"use client";

import { CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { collectSalePayment } from "@/lib/actions/credit";
import type { SaleCreditPayment } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  saleId: string;
  totalAmount: number;
  payments: SaleCreditPayment[];
}

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
];

/**
 * Displays AR collection history and a "Collect Payment" button for credit sales.
 *
 * Security: server action `collectSalePayment` enforces owner-only access.
 */
export function SaleCreditPaymentsClient({
  saleId,
  totalAmount,
  payments,
}: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const collected = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = totalAmount - collected;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    const result = await collectSalePayment(saleId, formData);
    setLoading(false);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Payment collected", type: "success" });
      setShowModal(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Accounts Receivable
          </h2>
          {outstanding > 0 && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-3 w-3" aria-hidden="true" />
              Collect Payment
            </Button>
          )}
        </div>

        <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-sm font-semibold dark:text-gray-100">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Collected
            </p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(collected)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Outstanding
            </p>
            <p
              className={`text-sm font-semibold ${
                outstanding > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {formatCurrency(outstanding)}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <p className="p-4 text-sm text-gray-400 dark:text-gray-500">
            No collections recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Method
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 dark:border-gray-700/50"
                  >
                    <td className="py-2 px-4 text-gray-600 dark:text-gray-400">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="py-2 px-4">
                      <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 capitalize">
                        <CreditCard
                          className="h-3.5 w-3.5 text-gray-400"
                          aria-hidden="true"
                        />
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-2 px-4 text-gray-500 dark:text-gray-400">
                      {p.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          open={showModal}
          title="Collect Customer Payment"
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={String(outstanding)}
              placeholder={formatCurrency(outstanding)}
              required
            />
            <Select
              label="Payment Method"
              name="payment_method"
              options={paymentMethodOptions}
              defaultValue="cash"
            />
            <Input
              label="Notes (optional)"
              name="notes"
              placeholder="Reference number, memo..."
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Collect Payment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
