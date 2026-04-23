"use client";

import { CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { collectSalePayment } from "@/lib/actions/credit";
import { useI18n } from "@/lib/i18n/context";
import type { SaleCreditPayment } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  saleId: string;
  totalAmount: number;
  payments: SaleCreditPayment[];
}

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
  const { t } = useI18n();
  const paymentMethodOptions = [
    { value: "cash", label: t.common.cash },
    { value: "transfer", label: t.common.transfer },
  ];
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
      setToast({ message: t.credit.paymentCollected, type: "success" });
      setShowModal(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t.credit.accountsReceivable}
          </h2>
          {outstanding > 0 && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-3 w-3" aria-hidden="true" />
              {t.credit.collectPayment}
            </Button>
          )}
        </div>

        <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.credit.total}
            </p>
            <p className="text-sm font-semibold dark:text-gray-100">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.credit.collected}
            </p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(collected)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.credit.outstanding}
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
            {t.credit.noCollections}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.date}
                  </th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.method}
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.common.amount}
                  </th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.credit.notes}
                  </th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {t.common.createdBy}
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
                    <td className="py-2 px-4 text-gray-500 dark:text-gray-400">
                      {p.created_by_name || "—"}
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
          title={t.credit.collectCustomerPayment}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <NumericInput
              label={t.common.amount}
              name="amount"
              placeholder={formatCurrency(outstanding)}
              required
            />
            <Select
              label={t.credit.paymentMethod}
              name="payment_method"
              options={paymentMethodOptions}
              defaultValue="cash"
            />
            <Input
              label={t.credit.notesOptional}
              name="notes"
              placeholder={t.credit.referenceMemo}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" loading={loading}>
                {loading ? t.common.saving : t.credit.collectPayment}
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
