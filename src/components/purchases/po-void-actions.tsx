"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { voidPurchaseOrder } from "@/lib/actions/purchases";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  poId: string;
  status: string;
}

export function POVoidActions({ poId, status }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  if (status !== "received") return null;

  async function handleVoid() {
    if (!reason.trim()) return;
    setLoading(true);
    const result = await voidPurchaseOrder(poId, reason);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.purchases.poVoidedSuccess, type: "success" });
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
        {t.purchases.voidPO}
      </Button>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReason("");
        }}
        title={t.purchases.voidPO}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.purchases.voidPOConfirm}
          </p>
          <Input
            label={t.purchases.reasonForVoiding}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder={t.purchases.voidPlaceholder}
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
              {loading ? t.common.processing : t.purchases.confirmVoid}
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
