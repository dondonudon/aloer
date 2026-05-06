"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { voidSale } from "@/lib/actions/sales";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
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
      setToast({ message: t.settings.saleVoided, type: "success" });
      router.refresh();
    }
    setVoidingId(null);
    setVoidReason("");
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t.settings.salesHistory}
      </h2>

      {(() => {
        const columns: DataTableColumn<Sale>[] = [
          {
            id: "invoice",
            header: t.settings.invoice,
            cellClassName: "font-mono text-gray-700 dark:text-gray-300",
            cell: (s) => s.invoice_number,
          },
          {
            id: "amount",
            header: t.settings.amount,
            align: "right",
            cellClassName: "text-gray-900 dark:text-gray-100 font-medium",
            cell: (s) => formatCurrency(s.total_amount),
          },
          {
            id: "payment",
            header: t.settings.payment,
            cellClassName: "text-gray-600 dark:text-gray-400 capitalize",
            cell: (s) => s.payment_method,
          },
          {
            id: "status",
            header: t.settings.status,
            align: "center",
            cell: (s) => (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  statusColors[s.status] ?? ""
                }`}
              >
                {s.status}
              </span>
            ),
          },
          {
            id: "date",
            header: t.settings.date,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (s) => formatDateTime(s.created_at),
          },
          {
            id: "actions",
            header: t.settings.actions,
            align: "center",
            cell: (s) => (
              <>
                {s.status === "completed" && (
                  <button
                    type="button"
                    onClick={() => setVoidingId(s.id)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium"
                    aria-label={`Void sale ${s.invoice_number}`}
                  >
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.settings.void}
                  </button>
                )}
                {s.status === "voided" && s.void_reason && (
                  <span className="text-xs text-gray-400">{s.void_reason}</span>
                )}
              </>
            ),
          },
        ];
        return (
          <DataTable
            columns={columns}
            rows={sales}
            rowKey={(s) => s.id}
            emptyMessage={t.settings.noSalesYet}
          />
        );
      })()}

      <Modal
        open={!!voidingId}
        onClose={() => setVoidingId(null)}
        title={t.settings.voidSale}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.settings.voidConfirmFull}
          </p>
          <Input
            label={t.settings.reasonForVoiding}
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            required
            placeholder={t.settings.voidPlaceholder}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setVoidingId(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleVoid}
              disabled={loading || !voidReason.trim()}
            >
              {loading ? t.common.processing : t.settings.voidSale}
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
