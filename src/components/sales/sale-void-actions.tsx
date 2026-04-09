"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { voidSale } from "@/lib/actions/sales";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  saleId: string;
  status: string;
}

/**
 * Void action button for a completed sale, shown only on the detail page.
 * Requires a mandatory reason before confirming — prevents accidental voids.
 */
export function SaleVoidActions({ saleId, status }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  if (status !== "completed") return null;

  async function handleVoid() {
    if (!reason.trim()) return;
    setLoading(true);
    const result = await voidSale(saleId, reason);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.sales.saleVoidedSuccess, type: "success" });
      router.refresh();
    }
    setModalOpen(false);
    setReason("");
    setLoading(false);
  }

  return (
    <>
      <Button variant="danger" onClick={() => setModalOpen(true)}>
        <XCircle className="h-4 w-4" aria-hidden="true" />
        {t.sales.voidSale}
      </Button>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReason("");
        }}
        title={t.sales.voidSale}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.sales.voidConfirm}
          </p>
          <Input
            label={t.sales.reasonForVoiding}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder={t.sales.voidPlaceholder}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setReason("");
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleVoid}
              disabled={loading || !reason.trim()}
            >
              {loading ? t.common.processing : t.sales.confirmVoid}
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
