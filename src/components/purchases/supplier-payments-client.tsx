"use client";

import { CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { paySupplier } from "@/lib/actions/supplier-payments";
import { useI18n } from "@/lib/i18n/context";
import type { SupplierPayment } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  poId: string;
  totalAmount: number;
  payments: SupplierPayment[];
}

export function SupplierPaymentsClient({ poId, totalAmount, payments }: Props) {
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

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = totalAmount - paidAmount;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    const result = await paySupplier(poId, formData);
    setLoading(false);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.credit.paymentRecorded, type: "success" });
      setShowModal(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t.credit.accountsPayable}
          </h2>
          {outstanding > 0 && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-3 w-3" aria-hidden="true" />
              {t.credit.recordPayment}
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
              {t.credit.paid}
            </p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.credit.outstanding}
            </p>
            <p
              className={`text-sm font-semibold ${
                outstanding > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {formatCurrency(outstanding)}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <p className="p-4 text-sm text-gray-400 dark:text-gray-500">
            {t.credit.noPOPayments}
          </p>
        ) : (
          (() => {
            const columns: DataTableColumn<SupplierPayment>[] = [
              {
                id: "date",
                header: t.credit.date,
                cellClassName: "text-gray-600 dark:text-gray-400",
                cell: (p) => formatDateTime(p.created_at),
              },
              {
                id: "method",
                header: t.credit.method,
                cell: (p) => (
                  <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 capitalize">
                    <CreditCard
                      className="h-3.5 w-3.5 text-gray-400"
                      aria-hidden="true"
                    />
                    {p.payment_method}
                  </span>
                ),
              },
              {
                id: "amount",
                header: t.common.amount,
                align: "right",
                cellClassName: "font-medium text-gray-900 dark:text-gray-100",
                cell: (p) => formatCurrency(p.amount),
              },
              {
                id: "notes",
                header: t.credit.notes,
                cellClassName: "text-gray-500 dark:text-gray-400",
                cell: (p) => p.notes || "—",
              },
              {
                id: "createdBy",
                header: t.common.createdBy,
                cellClassName: "text-gray-500 dark:text-gray-400",
                cell: (p) => p.created_by_name || "—",
              },
            ];
            return (
              <DataTable
                columns={columns}
                rows={payments}
                rowKey={(p) => p.id}
                emptyMessage={t.credit.noPOPayments}
                unstyled
              />
            );
          })()
        )}
      </div>

      {showModal && (
        <Modal
          open={showModal}
          title={t.credit.recordSupplierPayment}
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
                {loading ? t.common.saving : t.credit.recordPayment}
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
